export const ALLOWED_SHOP_CATEGORIES = [
  "melee",
  "ranged",
  "magic",
  "armor",
  "cloth_armor",
  "leather_armor",
  "plate_armor",
  "cloth_helmet",
  "leather_helmet",
  "plate_helmet",
  "cloth_shoes",
  "leather_shoes",
  "plate_shoes",
  "bag",
  "cape",
  "accessories",
  "mounts",
  "consumables",
] as const;

export type ShopCategory = (typeof ALLOWED_SHOP_CATEGORIES)[number];

export const ALLOWED_SHOP_CATEGORY_SET = new Set<string>(ALLOWED_SHOP_CATEGORIES);
