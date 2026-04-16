import { describe, it, expect } from "vitest";
import { computeBestRoutes } from "../../src/lib/margin.js";
import type { PriceCacheRow } from "../../src/db/schema.js";

function row(partial: Partial<PriceCacheRow> & { city: string }): PriceCacheRow {
  const now = Date.now();
  return {
    itemId: "T5_BAG",
    quality: 1,
    sellMin: 0,
    sellMinDate: null,
    sellMax: 0,
    buyMin: 0,
    buyMax: 0,
    buyMaxDate: null,
    updatedAt: now,
    ttlSeconds: 300,
    ...partial,
  };
}

describe("computeBestRoutes", () => {
  const opts = { isPremium: true, setupFeeRate: 0.025 };

  it("pone la ruta rentable primero", () => {
    const rows: PriceCacheRow[] = [
      row({ city: "Bridgewatch", sellMin: 1000, buyMax: 500 }),
      row({ city: "Caerleon", sellMin: 5000, buyMax: 2000 }),
    ];
    const routes = computeBestRoutes(rows, opts);
    expect(routes.length).toBeGreaterThan(0);
    expect(routes[0]!.buyCity).toBe("Bridgewatch");
    expect(routes[0]!.sellCity).toBe("Caerleon");
    expect(routes[0]!.profitPerUnit).toBeGreaterThan(0);
  });

  it("no usa ciudades como buy con sellMin=0 ni como sell con buyMax=0", () => {
    const rows: PriceCacheRow[] = [
      row({ city: "Bridgewatch", sellMin: 0, buyMax: 500 }),
      row({ city: "Caerleon", sellMin: 1000, buyMax: 0 }),
    ];
    const routes = computeBestRoutes(rows, opts);
    expect(routes.every((r) => r.buyPrice > 0 && r.sellPrice > 0)).toBe(true);
    expect(routes.every((r) => r.buyCity !== "Bridgewatch")).toBe(true);
    expect(routes.every((r) => r.sellCity !== "Caerleon")).toBe(true);
  });

  it("descarta rutas mismo-ciudad", () => {
    const rows: PriceCacheRow[] = [
      row({ city: "Caerleon", sellMin: 1000, buyMax: 2000 }),
    ];
    expect(computeBestRoutes(rows, opts).length).toBe(0);
  });

  it("ordena descendente por profit", () => {
    const rows: PriceCacheRow[] = [
      row({ city: "A", sellMin: 1000, buyMax: 500 }),
      row({ city: "B", sellMin: 1500, buyMax: 10000 }),
      row({ city: "C", sellMin: 2000, buyMax: 5000 }),
    ];
    const routes = computeBestRoutes(rows, opts);
    for (let i = 1; i < routes.length; i++) {
      expect(routes[i - 1]!.profitPerUnit).toBeGreaterThanOrEqual(routes[i]!.profitPerUnit);
    }
  });

  it("excluye rows stale > maxAgeMs", () => {
    const oldT = Date.now() - 3 * 60 * 60_000;
    const rows: PriceCacheRow[] = [
      row({ city: "A", sellMin: 1000, buyMax: 500, updatedAt: oldT }),
      row({ city: "B", sellMin: 2000, buyMax: 10000, updatedAt: oldT }),
    ];
    expect(computeBestRoutes(rows, opts).length).toBe(0);
  });

  it("respeta topN", () => {
    const rows: PriceCacheRow[] = [];
    for (let i = 0; i < 10; i++) {
      rows.push(row({ city: `C${i}`, sellMin: 100, buyMax: 1000 + i }));
    }
    const routes = computeBestRoutes(rows, { ...opts, topN: 3 });
    expect(routes.length).toBe(3);
  });

  it("incluye rutas no rentables (para UI de pérdidas)", () => {
    const rows: PriceCacheRow[] = [
      row({ city: "A", sellMin: 1000, buyMax: 500 }),
      row({ city: "B", sellMin: 500, buyMax: 501 }),
    ];
    const routes = computeBestRoutes(rows, opts);
    expect(routes.some((r) => r.profitPerUnit <= 0)).toBe(true);
  });
});
