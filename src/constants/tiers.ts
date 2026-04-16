export const ALLOWED_TIERS = [4, 5, 6, 7, 8] as const;
export const ALLOWED_ENCHANTS = [0, 1, 2, 3, 4] as const;
export const ALLOWED_QUALITIES = [1, 2, 3, 4, 5] as const;

export type Tier = (typeof ALLOWED_TIERS)[number];
export type Enchant = (typeof ALLOWED_ENCHANTS)[number];
export type Quality = (typeof ALLOWED_QUALITIES)[number];

export const QUALITY_LABELS: Record<Quality, string> = {
  1: "Normal",
  2: "Good",
  3: "Outstanding",
  4: "Excellent",
  5: "Masterpiece",
};
