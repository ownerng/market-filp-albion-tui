import { describe, it, expect } from "vitest";
import {
  computeProfit,
  salesTaxRateFor,
  SALES_TAX_PREMIUM,
  SALES_TAX_NO_PREMIUM,
  SETUP_FEE_RATE_DEFAULT,
} from "../../src/lib/fees.js";

describe("salesTaxRateFor", () => {
  it("4% con premium", () => {
    expect(salesTaxRateFor(true)).toBe(SALES_TAX_PREMIUM);
  });
  it("8% sin premium", () => {
    expect(salesTaxRateFor(false)).toBe(SALES_TAX_NO_PREMIUM);
  });
});

describe("computeProfit", () => {
  it("premium: sell 10000 buy 8000 → profit 2350", () => {
    const r = computeProfit({ buyPrice: 8000, sellPrice: 10000, isPremium: true });
    expect(r.setupFee).toBeCloseTo(250, 5);
    expect(r.salesTax).toBeCloseTo(400, 5);
    expect(r.netRevenue).toBeCloseTo(9350, 5);
    expect(r.profitPerUnit).toBeCloseTo(1350, 5);
    expect(r.roiPct).toBeCloseTo((1350 / 8000) * 100, 5);
  });

  it("no premium: mismo input, tax doble", () => {
    const r = computeProfit({ buyPrice: 8000, sellPrice: 10000, isPremium: false });
    expect(r.salesTax).toBeCloseTo(800, 5);
    expect(r.netRevenue).toBeCloseTo(8950, 5);
    expect(r.profitPerUnit).toBeCloseTo(950, 5);
  });

  it("setupFeeRate override", () => {
    const r = computeProfit({ buyPrice: 1000, sellPrice: 2000, isPremium: true, setupFeeRate: 0.05 });
    expect(r.setupFee).toBeCloseTo(100, 5);
  });

  it("buyPrice 0 → roiPct 0", () => {
    const r = computeProfit({ buyPrice: 0, sellPrice: 1000, isPremium: true });
    expect(r.roiPct).toBe(0);
  });

  it("profit negativo cuando fees > spread", () => {
    const r = computeProfit({ buyPrice: 980, sellPrice: 1000, isPremium: false });
    expect(r.profitPerUnit).toBeLessThan(0);
  });

  it("SETUP_FEE_RATE_DEFAULT = 0.025", () => {
    expect(SETUP_FEE_RATE_DEFAULT).toBe(0.025);
  });
});
