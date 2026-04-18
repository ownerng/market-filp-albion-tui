import { rawDb } from "../client.js";
import type { ItemRow } from "../schema.js";
import { normalize } from "../../lib/normalize.js";

export function countItems(): number {
  const row = rawDb().prepare("SELECT COUNT(*) as n FROM items").get() as { n: number };
  return row.n;
}

const ITEM_SELECT = `SELECT unique_name AS uniqueName, localized_es AS localizedEs, localized_en AS localizedEn, normalized_es AS normalizedEs, normalized_en AS normalizedEn, tier, enchant, category, subcategory, item_value AS itemValue, shop_category AS shopCategory FROM items`;

export function searchItems(query: string, limit = 0, tier: number | null = null): ItemRow[] {
  const db = rawDb();
  const q = normalize(query);
  const tierClause = tier !== null ? "tier = ?" : null;
  const tierParams = tier !== null ? [tier] : [];
  const limitSql = limit > 0 ? " LIMIT ?" : "";
  const limitParam = limit > 0 ? [limit] : [];

  if (q === "") {
    const where = tierClause ? ` WHERE ${tierClause}` : "";
    return db
      .prepare(`${ITEM_SELECT}${where} ORDER BY tier ASC, enchant ASC, localized_es ASC${limitSql}`)
      .all(...tierParams, ...limitParam) as ItemRow[];
  }
  const like = `%${q}%`;
  const searchWhere = `(normalized_es LIKE ? OR normalized_en LIKE ? OR LOWER(unique_name) LIKE ?)`;
  const where = tierClause ? `${searchWhere} AND ${tierClause}` : searchWhere;
  return db
    .prepare(
      `${ITEM_SELECT}
       WHERE ${where}
       ORDER BY tier ASC, enchant ASC, localized_es ASC${limitSql}`,
    )
    .all(like, like, like, ...tierParams, ...limitParam) as ItemRow[];
}

export function findByUniqueName(uniqueName: string): ItemRow | null {
  const row = rawDb()
    .prepare("SELECT unique_name AS uniqueName, localized_es AS localizedEs, localized_en AS localizedEn, normalized_es AS normalizedEs, normalized_en AS normalizedEn, tier, enchant, category, subcategory, item_value AS itemValue, shop_category AS shopCategory FROM items WHERE unique_name = ?")
    .get(uniqueName) as ItemRow | undefined;
  return row ?? null;
}

export interface InsertItemInput {
  uniqueName: string;
  localizedEs: string;
  localizedEn: string;
  tier: number;
  enchant: number;
  category: string;
  subcategory: string;
  itemValue: number;
  shopCategory: string;
}

export function bulkInsertItems(rows: InsertItemInput[]): number {
  const db = rawDb();
  const stmt = db.prepare(
    `INSERT OR REPLACE INTO items
      (unique_name, localized_es, localized_en, normalized_es, normalized_en,
       tier, enchant, category, subcategory, item_value, shop_category)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  );
  const tx = db.transaction((entries: InsertItemInput[]) => {
    for (const e of entries) {
      stmt.run(
        e.uniqueName,
        e.localizedEs,
        e.localizedEn,
        normalize(e.localizedEs),
        normalize(e.localizedEn),
        e.tier,
        e.enchant,
        e.category,
        e.subcategory,
        e.itemValue,
        e.shopCategory,
      );
    }
  });
  tx(rows);
  return rows.length;
}

export function clearItems(): void {
  rawDb().prepare("DELETE FROM items").run();
}
