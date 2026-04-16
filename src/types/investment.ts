export type InvestmentStatus = "open" | "closed" | "cancelled";

export interface Investment {
  id: number;
  itemUniqueName: string;
  quality: number;
  quantity: number;
  buyPricePerUnit: number;
  buyCity: string;
  buyDate: number;
  targetSellCity: string | null;
  expectedSellPrice: number | null;
  status: InvestmentStatus;
  sellPriceActual: number | null;
  sellDate: number | null;
  notes: string | null;
}
