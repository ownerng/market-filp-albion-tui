import type { Quality } from "../constants/tiers.js";
import type { CityId } from "../constants/cities.js";

export interface PriceRow {
  itemId: string;
  city: CityId;
  quality: Quality;
  sellMin: number;
  sellMinDate: number | null;
  sellMax: number;
  buyMin: number;
  buyMax: number;
  buyMaxDate: number | null;
  updatedAt: number;
  ttlSeconds: number;
}
