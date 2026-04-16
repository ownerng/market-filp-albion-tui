import { rawDb } from "../client.js";
import type { PriceCacheRow } from "../schema.js";

export function readCache(itemId: string, qualities: number[], cities: string[]): PriceCacheRow[] {
  if (qualities.length === 0 || cities.length === 0) return [];
  const qPlaceholders = qualities.map(() => "?").join(",");
  const cPlaceholders = cities.map(() => "?").join(",");
  const sql = `SELECT item_id AS itemId, city, quality,
                      sell_min AS sellMin, sell_min_date AS sellMinDate, sell_max AS sellMax,
                      buy_min AS buyMin, buy_max AS buyMax, buy_max_date AS buyMaxDate,
                      updated_at AS updatedAt, ttl_seconds AS ttlSeconds
               FROM price_cache
               WHERE item_id = ? AND quality IN (${qPlaceholders}) AND city IN (${cPlaceholders})`;
  return rawDb()
    .prepare(sql)
    .all(itemId, ...qualities, ...cities) as PriceCacheRow[];
}

export interface UpsertPriceInput {
  itemId: string;
  city: string;
  quality: number;
  sellMin: number;
  sellMinDate: number | null;
  sellMax: number;
  buyMin: number;
  buyMax: number;
  buyMaxDate: number | null;
  updatedAt: number;
  ttlSeconds: number;
}

export function upsertPrices(rows: UpsertPriceInput[]): void {
  const db = rawDb();
  const stmt = db.prepare(
    `INSERT OR REPLACE INTO price_cache
      (item_id, city, quality, sell_min, sell_min_date, sell_max,
       buy_min, buy_max, buy_max_date, updated_at, ttl_seconds)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  );
  const tx = db.transaction((entries: UpsertPriceInput[]) => {
    for (const e of entries) {
      stmt.run(
        e.itemId,
        e.city,
        e.quality,
        e.sellMin,
        e.sellMinDate,
        e.sellMax,
        e.buyMin,
        e.buyMax,
        e.buyMaxDate,
        e.updatedAt,
        e.ttlSeconds,
      );
    }
  });
  tx(rows);
}

export function flushPriceCache(): void {
  rawDb().prepare("DELETE FROM price_cache").run();
}
