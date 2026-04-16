import { request } from "undici";
import {
  HOSTS,
  pricesEndpoint,
  MAX_URL_LEN,
  type Region,
} from "./endpoints.js";
import { priceResponseArraySchema, type ApiPriceResponse } from "./schemas.js";
import { apiQueue, pauseQueue } from "./rate-limiter.js";
import { upsertPrices } from "../db/queries/prices.js";
import { logger } from "../lib/logger.js";

export interface FetchPricesOptions {
  itemIds: string[];
  qualities: number[];
  locations: string[];
  region?: Region;
  ttlSeconds?: number;
  signal?: AbortSignal;
}

export function batchIds(ids: string[], baseUrlLen: number, suffixLen: number): string[][] {
  const out: string[][] = [];
  let current: string[] = [];
  let len = baseUrlLen + suffixLen;
  for (const id of ids) {
    const addLen = id.length + 1;
    if (len + addLen > MAX_URL_LEN && current.length > 0) {
      out.push(current);
      current = [];
      len = baseUrlLen + suffixLen;
    }
    current.push(id);
    len += addLen;
  }
  if (current.length > 0) out.push(current);
  return out;
}

function parseDate(s: string | null | undefined): number | null {
  if (!s) return null;
  const ts = Date.parse(s + (s.endsWith("Z") ? "" : "Z"));
  return Number.isFinite(ts) ? ts : null;
}

async function fetchBatch(
  region: Region,
  ids: string[],
  qualities: number[],
  locations: string[],
  signal?: AbortSignal,
): Promise<ApiPriceResponse[]> {
  const url = pricesEndpoint(region, ids);
  const params = new URLSearchParams();
  if (locations.length > 0) params.set("locations", locations.join(","));
  if (qualities.length > 0) params.set("qualities", qualities.join(","));
  const fullUrl = params.toString() ? `${url}?${params}` : url;

  const res = await request(fullUrl, {
    method: "GET",
    signal,
    headersTimeout: 10_000,
    bodyTimeout: 15_000,
  });

  if (res.statusCode === 429) {
    pauseQueue(60_000);
    throw new Error("HTTP 429 rate-limited — queue paused 60s");
  }
  if (res.statusCode < 200 || res.statusCode >= 300) {
    const body = await res.body.text().catch(() => "");
    throw new Error(`HTTP ${res.statusCode} ${body.slice(0, 200)}`);
  }

  const json = await res.body.json();
  const parsed = priceResponseArraySchema.safeParse(json);
  if (!parsed.success) {
    logger.warn({ issues: parsed.error.issues.slice(0, 3) }, "API response failed zod");
    return [];
  }
  return parsed.data;
}

export async function fetchPrices(opts: FetchPricesOptions): Promise<number> {
  const region = opts.region ?? "americas";
  const ttl = opts.ttlSeconds ?? 300;
  const baseHost = HOSTS[region] + "/api/v2/stats/prices/";
  const qs = new URLSearchParams();
  if (opts.locations.length > 0) qs.set("locations", opts.locations.join(","));
  if (opts.qualities.length > 0) qs.set("qualities", opts.qualities.join(","));
  const suffixLen = (".json?" + qs.toString()).length;

  const batches = batchIds(opts.itemIds, baseHost.length, suffixLen);

  let writtenCount = 0;
  for (const batch of batches) {
    const rows: ApiPriceResponse[] = (await apiQueue.add(() =>
      fetchBatch(region, batch, opts.qualities, opts.locations, opts.signal),
    )) ?? [];

    const now = Date.now();
    const seen = new Set<string>();
    const upsert = rows.map((r) => {
      const key = `${r.item_id}|${r.city}|${r.quality}`;
      seen.add(key);
      return {
        itemId: r.item_id,
        city: r.city,
        quality: r.quality,
        sellMin: r.sell_price_min,
        sellMinDate: parseDate(r.sell_price_min_date),
        sellMax: r.sell_price_max,
        buyMin: r.buy_price_min,
        buyMax: r.buy_price_max,
        buyMaxDate: parseDate(r.buy_price_max_date),
        updatedAt: now,
        ttlSeconds: ttl,
      };
    });

    for (const id of batch) {
      for (const city of opts.locations) {
        for (const q of opts.qualities) {
          const key = `${id}|${city}|${q}`;
          if (seen.has(key)) continue;
          upsert.push({
            itemId: id,
            city,
            quality: q,
            sellMin: 0,
            sellMinDate: null,
            sellMax: 0,
            buyMin: 0,
            buyMax: 0,
            buyMaxDate: null,
            updatedAt: now,
            ttlSeconds: ttl,
          });
        }
      }
    }

    if (upsert.length > 0) {
      upsertPrices(upsert);
      writtenCount += upsert.length;
    }
  }

  return writtenCount;
}
