import { computeProfit } from "./fees.js";
import type { PriceCacheRow } from "../db/schema.js";

export interface Route {
  buyCity: string;
  sellCity: string;
  buyPrice: number;
  sellPrice: number;
  profitPerUnit: number;
  roiPct: number;
  ageMs: number;
}

export interface RouteOptions {
  isPremium: boolean;
  setupFeeRate: number;
  maxAgeMs?: number;
  topN?: number;
}

export function computeBestRoutes(rows: PriceCacheRow[], opts: RouteOptions): Route[] {
  const maxAge = opts.maxAgeMs ?? 2 * 60 * 60_000;
  const now = Date.now();
  const valid = rows.filter((r) => now - r.updatedAt <= maxAge);
  const routes: Route[] = [];

  for (const buy of valid) {
    if (buy.sellMin <= 0) continue;
    for (const sell of valid) {
      if (sell.buyMax <= 0) continue;
      if (sell.city === buy.city) continue;

      const { profitPerUnit, roiPct } = computeProfit({
        buyPrice: buy.sellMin,
        sellPrice: sell.buyMax,
        isPremium: opts.isPremium,
        setupFeeRate: opts.setupFeeRate,
      });

      const age = Math.max(now - buy.updatedAt, now - sell.updatedAt);
      routes.push({
        buyCity: buy.city,
        sellCity: sell.city,
        buyPrice: buy.sellMin,
        sellPrice: sell.buyMax,
        profitPerUnit,
        roiPct,
        ageMs: age,
      });
    }
  }

  routes.sort((a, b) => b.profitPerUnit - a.profitPerUnit);
  return routes.slice(0, opts.topN ?? 5);
}
