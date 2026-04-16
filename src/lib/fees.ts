export const SETUP_FEE_RATE_DEFAULT = 0.025;
export const SALES_TAX_PREMIUM = 0.04;
export const SALES_TAX_NO_PREMIUM = 0.08;

export interface FeeInput {
  buyPrice: number;
  sellPrice: number;
  isPremium: boolean;
  setupFeeRate?: number;
}

export interface FeeResult {
  setupFee: number;
  salesTaxRate: number;
  salesTax: number;
  netRevenue: number;
  profitPerUnit: number;
  roiPct: number;
}

export function salesTaxRateFor(isPremium: boolean): number {
  return isPremium ? SALES_TAX_PREMIUM : SALES_TAX_NO_PREMIUM;
}

export function computeProfit(input: FeeInput): FeeResult {
  const setupFeeRate = input.setupFeeRate ?? SETUP_FEE_RATE_DEFAULT;
  const salesTaxRate = salesTaxRateFor(input.isPremium);
  const setupFee = input.sellPrice * setupFeeRate;
  const salesTax = input.sellPrice * salesTaxRate;
  const netRevenue = input.sellPrice - salesTax - setupFee;
  const profitPerUnit = netRevenue - input.buyPrice;
  const roiPct = input.buyPrice > 0 ? (profitPerUnit / input.buyPrice) * 100 : 0;
  return { setupFee, salesTaxRate, salesTax, netRevenue, profitPerUnit, roiPct };
}
