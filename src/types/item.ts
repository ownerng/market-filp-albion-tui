import type { Tier, Enchant } from "../constants/tiers.js";

export interface Item {
  uniqueName: string;
  localizedEs: string;
  localizedEn: string;
  normalizedEs: string;
  normalizedEn: string;
  tier: Tier;
  enchant: Enchant;
  category: string;
  subcategory: string;
  itemValue: number;
  shopCategory: string;
}
