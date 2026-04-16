import { rawDb } from "../client.js";
import type { InvestmentRow, InvestmentInsert } from "../schema.js";

const INV_SELECT = `SELECT id, item_unique_name AS itemUniqueName, quality, quantity,
              buy_price_per_unit AS buyPricePerUnit, buy_city AS buyCity, buy_date AS buyDate,
              target_sell_city AS targetSellCity, expected_sell_price AS expectedSellPrice,
              status, sell_price_actual AS sellPriceActual, sell_date AS sellDate, notes
       FROM investments`;

export function listInvestments(status?: "open" | "closed" | "cancelled"): InvestmentRow[] {
  const db = rawDb();
  if (status) {
    return db
      .prepare(`${INV_SELECT} WHERE status = ? ORDER BY id DESC`)
      .all(status) as InvestmentRow[];
  }
  return db.prepare(`${INV_SELECT} ORDER BY id DESC`).all() as InvestmentRow[];
}

export function getInvestment(id: number): InvestmentRow | null {
  const row = rawDb()
    .prepare(`${INV_SELECT} WHERE id = ?`)
    .get(id) as InvestmentRow | undefined;
  return row ?? null;
}

export function createInvestment(input: Omit<InvestmentInsert, "id">): number {
  const res = rawDb()
    .prepare(
      `INSERT INTO investments
        (item_unique_name, quality, quantity, buy_price_per_unit, buy_city, buy_date,
         target_sell_city, expected_sell_price, status, sell_price_actual, sell_date, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .run(
      input.itemUniqueName,
      input.quality ?? 1,
      input.quantity,
      input.buyPricePerUnit,
      input.buyCity,
      input.buyDate,
      input.targetSellCity ?? null,
      input.expectedSellPrice ?? null,
      input.status ?? "open",
      input.sellPriceActual ?? null,
      input.sellDate ?? null,
      input.notes ?? null,
    );
  return Number(res.lastInsertRowid);
}

export function updateInvestment(id: number, patch: Partial<InvestmentRow>): void {
  const fields: string[] = [];
  const values: unknown[] = [];
  const map: Record<keyof InvestmentRow, string> = {
    id: "id",
    itemUniqueName: "item_unique_name",
    quality: "quality",
    quantity: "quantity",
    buyPricePerUnit: "buy_price_per_unit",
    buyCity: "buy_city",
    buyDate: "buy_date",
    targetSellCity: "target_sell_city",
    expectedSellPrice: "expected_sell_price",
    status: "status",
    sellPriceActual: "sell_price_actual",
    sellDate: "sell_date",
    notes: "notes",
  };
  for (const [key, value] of Object.entries(patch)) {
    if (key === "id") continue;
    const col = map[key as keyof InvestmentRow];
    if (!col) continue;
    fields.push(`${col} = ?`);
    values.push(value);
  }
  if (fields.length === 0) return;
  values.push(id);
  rawDb()
    .prepare(`UPDATE investments SET ${fields.join(", ")} WHERE id = ?`)
    .run(...values);
}

export function deleteInvestment(id: number): void {
  rawDb().prepare("DELETE FROM investments WHERE id = ?").run(id);
}

export function sumClosedProfit(): number {
  const row = rawDb()
    .prepare(
      `SELECT COALESCE(SUM((sell_price_actual - buy_price_per_unit) * quantity), 0) AS profit
       FROM investments
       WHERE status = 'closed' AND sell_price_actual IS NOT NULL`,
    )
    .get() as { profit: number };
  return row.profit;
}
