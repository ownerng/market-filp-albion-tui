import { rawDb } from "../client.js";
import { computeProfit } from "../../lib/fees.js";

export interface FlipRoute {
  itemId: string;
  itemName: string;
  quality: number;
  buyCity: string;
  sellCity: string;
  buyPrice: number;
  sellPrice: number;
  profitPerUnit: number;
  roiPct: number;
  ageMs: number;
}

interface CachedPrice {
  itemId: string;
  city: string;
  quality: number;
  sellMin: number;
  buyMax: number;
  updatedAt: number;
}

export function readAllCachedPrices(): CachedPrice[] {
  const db = rawDb();
  const now = Date.now();
  const maxAge = 60 * 60_000;
  return db
    .prepare(
      `SELECT item_id AS itemId, city, quality, sell_min AS sellMin, buy_max AS buyMax, updated_at AS updatedAt
       FROM price_cache
       WHERE updated_at > ? AND sell_min > 0`,
    )
    .all(now - maxAge) as CachedPrice[];
}

function buildItemNameMap(): Map<string, string> {
  const rows = rawDb()
    .prepare("SELECT unique_name, localized_es, localized_en FROM items")
    .all() as { unique_name: string; localized_es: string; localized_en: string }[];
  const m = new Map<string, string>();
  for (const r of rows) {
    m.set(r.unique_name, r.localized_es || r.localized_en || r.unique_name);
  }
  return m;
}

export function computeTopFlips(opts: {
  isPremium: boolean;
  setupFeeRate: number;
  topN?: number;
  minProfit?: number;
}): FlipRoute[] {
  const prices = readAllCachedPrices();
  const nameMap = buildItemNameMap();
  const groups = new Map<string, CachedPrice[]>();

  for (const p of prices) {
    if (p.buyMax <= 0 && p.sellMin <= 0) continue;
    const key = `${p.itemId}|${p.quality}`;
    let arr = groups.get(key);
    if (!arr) {
      arr = [];
      groups.set(key, arr);
    }
    arr.push(p);
  }

  const routes: FlipRoute[] = [];
  const now = Date.now();

  for (const [, entries] of groups) {
    for (const buy of entries) {
      if (buy.sellMin <= 0) continue;
      for (const sell of entries) {
        if (sell.buyMax <= 0) continue;
        if (sell.city === buy.city) continue;

        const { profitPerUnit, roiPct } = computeProfit({
          buyPrice: buy.sellMin,
          sellPrice: sell.buyMax,
          isPremium: opts.isPremium,
          setupFeeRate: opts.setupFeeRate,
        });

        if (opts.minProfit && profitPerUnit < opts.minProfit) continue;

        routes.push({
          itemId: buy.itemId,
          itemName: nameMap.get(buy.itemId) ?? buy.itemId,
          quality: buy.quality,
          buyCity: buy.city,
          sellCity: sell.city,
          buyPrice: buy.sellMin,
          sellPrice: sell.buyMax,
          profitPerUnit,
          roiPct,
          ageMs: Math.max(now - buy.updatedAt, now - sell.updatedAt),
        });
      }
    }
  }

  routes.sort((a, b) => b.profitPerUnit - a.profitPerUnit);
  return routes.slice(0, opts.topN ?? 50);
}

export function getCachedItemIds(): string[] {
  const rows = rawDb().prepare("SELECT DISTINCT item_id FROM price_cache").all() as {
    item_id: string;
  }[];
  return rows.map((r) => r.item_id);
}

export function getPopularItemIds(limit = 80): string[] {
  const rows = rawDb()
    .prepare(
      `SELECT unique_name FROM items
       WHERE shop_category IN ('melee','ranged','magic','armor','cloth_armor','leather_armor','plate_armor',
         'cloth_helmet','leather_helmet','plate_helmet','cloth_shoes','leather_shoes','plate_shoes',
         'bag','cape','accessories','consumables')
       AND tier BETWEEN 4 AND 8
       ORDER BY tier, unique_name
       LIMIT ?`,
    )
    .all(limit) as { unique_name: string }[];
  return rows.map((r) => r.unique_name);
}
