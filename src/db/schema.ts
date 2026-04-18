import { sqliteTable, text, integer, primaryKey, index } from "drizzle-orm/sqlite-core";

export const items = sqliteTable(
  "items",
  {
    uniqueName: text("unique_name").primaryKey(),
    localizedEs: text("localized_es").notNull(),
    localizedEn: text("localized_en").notNull(),
    normalizedEs: text("normalized_es").notNull(),
    normalizedEn: text("normalized_en").notNull(),
    tier: integer("tier").notNull(),
    enchant: integer("enchant").notNull().default(0),
    category: text("category").notNull(),
    subcategory: text("subcategory").notNull(),
    itemValue: integer("item_value").notNull(),
    shopCategory: text("shop_category").notNull(),
  },
  (t) => [
    index("idx_items_norm_es").on(t.normalizedEs),
    index("idx_items_norm_en").on(t.normalizedEn),
    index("idx_items_tier").on(t.tier, t.category),
  ],
);

export const priceCache = sqliteTable(
  "price_cache",
  {
    itemId: text("item_id").notNull(),
    city: text("city").notNull(),
    quality: integer("quality").notNull(),
    sellMin: integer("sell_min").notNull().default(0),
    sellMinDate: integer("sell_min_date"),
    sellMax: integer("sell_max").notNull().default(0),
    buyMin: integer("buy_min").notNull().default(0),
    buyMax: integer("buy_max").notNull().default(0),
    buyMaxDate: integer("buy_max_date"),
    updatedAt: integer("updated_at").notNull(),
    ttlSeconds: integer("ttl_seconds").notNull().default(300),
  },
  (t) => [
    primaryKey({ columns: [t.itemId, t.city, t.quality] }),
    index("idx_price_updated").on(t.updatedAt),
  ],
);

export const investments = sqliteTable(
  "investments",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    itemUniqueName: text("item_unique_name")
      .notNull()
      .references(() => items.uniqueName),
    quality: integer("quality").notNull().default(1),
    quantity: integer("quantity").notNull(),
    buyPricePerUnit: integer("buy_price_per_unit").notNull(),
    buyCity: text("buy_city").notNull(),
    buyDate: integer("buy_date").notNull(),
    targetSellCity: text("target_sell_city"),
    expectedSellPrice: integer("expected_sell_price"),
    status: text("status", { enum: ["open", "closed", "cancelled"] })
      .notNull()
      .default("open"),
    sellPriceActual: integer("sell_price_actual"),
    sellDate: integer("sell_date"),
    notes: text("notes"),
  },
  (t) => [
    index("idx_inv_status").on(t.status),
    index("idx_inv_item").on(t.itemUniqueName),
  ],
);

export const settings = sqliteTable("settings", {
  key: text("key").primaryKey(),
  value: text("value").notNull(),
});

export type ItemRow = typeof items.$inferSelect;
export type ItemInsert = typeof items.$inferInsert;
export type PriceCacheRow = typeof priceCache.$inferSelect;
export type PriceCacheInsert = typeof priceCache.$inferInsert;
export type InvestmentRow = typeof investments.$inferSelect;
export type InvestmentInsert = typeof investments.$inferInsert;
export type SettingRow = typeof settings.$inferSelect;
