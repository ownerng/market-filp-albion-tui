import { fetch } from "undici";
import { bulkInsertItems, countItems, type InsertItemInput } from "./queries/items.js";
import { setSetting } from "./queries/settings.js";
import { ALLOWED_TIERS, ALLOWED_ENCHANTS } from "../constants/tiers.js";
import { logger } from "../lib/logger.js";

const ITEMS_URL =
  "https://raw.githubusercontent.com/ao-data/ao-bin-dumps/master/formatted/items.json";

interface RawItem {
  UniqueName?: string;
  LocalizedNames?: Record<string, string> | null;
  LocalizationNameVariable?: string;
  Index?: string;
}

export interface SeedResult {
  downloaded: number;
  inserted: number;
  skipped: number;
}

export async function fetchItemsJson(url = ITEMS_URL): Promise<RawItem[]> {
  logger.info({ url }, "Descargando items.json");
  const res = await fetch(url, { method: "GET", redirect: "follow" });
  if (res.status !== 200) {
    throw new Error(`HTTP ${res.status} descargando items.json`);
  }
  const raw = (await res.json()) as unknown;
  if (!Array.isArray(raw)) throw new Error("items.json no es un array");
  return raw as RawItem[];
}

export function parseEnchantFromUniqueName(name: string): { base: string; enchant: number } {
  const m = name.match(/^(.+?)@(\d+)$/);
  if (!m || !m[1] || !m[2]) return { base: name, enchant: 0 };
  return { base: m[1], enchant: Number(m[2]) };
}

export function parseTierFromUniqueName(name: string): number | null {
  const m = name.match(/^T(\d)_/);
  if (!m || !m[1]) return null;
  return Number(m[1]);
}

interface Classification {
  category: string;
  subcategory: string;
  shopCategory: string;
}

export function classifyFromUniqueName(base: string): Classification | null {
  const n = base.toUpperCase();

  if (/_MOUNT_|_MOUNTUPGRADETOKEN/.test(n)) return { category: "mount", subcategory: "mount", shopCategory: "mounts" };
  if (/_BAG/.test(n)) return { category: "bag", subcategory: "bag", shopCategory: "bag" };
  if (/_CAPE/.test(n)) return { category: "cape", subcategory: "cape", shopCategory: "cape" };

  if (/_MEAL_/.test(n)) return { category: "consumable", subcategory: "food", shopCategory: "consumables" };
  if (/_POTION_/.test(n)) return { category: "consumable", subcategory: "potion", shopCategory: "consumables" };
  if (/_FISH_/.test(n)) return { category: "consumable", subcategory: "fish", shopCategory: "consumables" };

  if (/_HEAD_CLOTH/.test(n)) return { category: "helmet", subcategory: "cloth_helmet", shopCategory: "cloth_helmet" };
  if (/_HEAD_LEATHER/.test(n)) return { category: "helmet", subcategory: "leather_helmet", shopCategory: "leather_helmet" };
  if (/_HEAD_PLATE/.test(n)) return { category: "helmet", subcategory: "plate_helmet", shopCategory: "plate_helmet" };

  if (/_ARMOR_CLOTH/.test(n)) return { category: "armor", subcategory: "cloth_armor", shopCategory: "cloth_armor" };
  if (/_ARMOR_LEATHER/.test(n)) return { category: "armor", subcategory: "leather_armor", shopCategory: "leather_armor" };
  if (/_ARMOR_PLATE/.test(n)) return { category: "armor", subcategory: "plate_armor", shopCategory: "plate_armor" };

  if (/_SHOES_CLOTH/.test(n)) return { category: "shoes", subcategory: "cloth_shoes", shopCategory: "cloth_shoes" };
  if (/_SHOES_LEATHER/.test(n)) return { category: "shoes", subcategory: "leather_shoes", shopCategory: "leather_shoes" };
  if (/_SHOES_PLATE/.test(n)) return { category: "shoes", subcategory: "plate_shoes", shopCategory: "plate_shoes" };

  if (/_OFF_SHIELD|_OFF_TORCH|_OFF_BOOK|_OFF_ORB|_OFF_HORN|_OFF_JESTER|_OFF_TOWER|_OFF_DEMON|_OFF_CENSER/.test(n)) {
    return { category: "weapon", subcategory: "off_hand", shopCategory: "magic" };
  }
  if (/_2H_BOW|_2H_CROSSBOW|_2H_LONGBOW|_2H_WARBOW|_2H_WHISPERINGBOW/.test(n)) {
    return { category: "weapon", subcategory: "bow", shopCategory: "ranged" };
  }
  if (/_2H_FIRE|_2H_HOLY|_2H_NATURE|_2H_ARCANE|_2H_FROST|_2H_CURSED|_MAIN_FIRE|_MAIN_HOLY|_MAIN_NATURE|_MAIN_ARCANE|_MAIN_FROST|_MAIN_CURSED/.test(n)) {
    return { category: "weapon", subcategory: "staff", shopCategory: "magic" };
  }
  if (/_2H_|_MAIN_/.test(n)) {
    return { category: "weapon", subcategory: "melee", shopCategory: "melee" };
  }

  return null;
}

export function filterAndMap(raw: RawItem[]): InsertItemInput[] {
  const tierSet = new Set<number>(ALLOWED_TIERS);
  const enchantSet = new Set<number>(ALLOWED_ENCHANTS);
  const out: InsertItemInput[] = [];

  for (const r of raw) {
    if (!r.UniqueName) continue;

    const { base, enchant } = parseEnchantFromUniqueName(r.UniqueName);
    if (!enchantSet.has(enchant)) continue;

    const tier = parseTierFromUniqueName(base);
    if (tier === null || !tierSet.has(tier)) continue;

    const cls = classifyFromUniqueName(base);
    if (!cls) continue;

    const loc = r.LocalizedNames ?? {};
    const en = loc["EN-US"] ?? r.UniqueName;
    const es = loc["ES-ES"] ?? en;

    out.push({
      uniqueName: r.UniqueName,
      localizedEs: es,
      localizedEn: en,
      tier,
      enchant,
      category: cls.category,
      subcategory: cls.subcategory,
      itemValue: 0,
      shopCategory: cls.shopCategory,
    });
  }
  return out;
}

export async function seedItems(opts?: { url?: string }): Promise<SeedResult> {
  const raw = await fetchItemsJson(opts?.url);
  const mapped = filterAndMap(raw);
  const inserted = bulkInsertItems(mapped);
  setSetting("last_seed_at", String(Date.now()));
  logger.info(
    { downloaded: raw.length, inserted, skipped: raw.length - inserted },
    "Seed completo",
  );
  return {
    downloaded: raw.length,
    inserted,
    skipped: raw.length - inserted,
  };
}

export function isSeedNeeded(): boolean {
  return countItems() === 0;
}
