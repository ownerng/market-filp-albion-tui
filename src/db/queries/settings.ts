import { rawDb } from "../client.js";
import { DEFAULT_SETTINGS, type AppSettings } from "../../types/settings.js";

export function getSetting(key: string): string | null {
  const row = rawDb()
    .prepare("SELECT value FROM settings WHERE key = ?")
    .get(key) as { value: string } | undefined;
  return row?.value ?? null;
}

export function setSetting(key: string, value: string): void {
  rawDb()
    .prepare("INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)")
    .run(key, value);
}

export function getAllSettings(): AppSettings {
  const rows = rawDb().prepare("SELECT key, value FROM settings").all() as {
    key: string;
    value: string;
  }[];
  const map = new Map(rows.map((r) => [r.key, r.value]));
  return {
    uiLanguage: (map.get("ui_language") as "es" | "en") ?? DEFAULT_SETTINGS.uiLanguage,
    premiumStatus: (map.get("premium_status") ?? "true") === "true",
    serverRegion:
      (map.get("server_region") as "americas" | "europe" | "asia") ?? DEFAULT_SETTINGS.serverRegion,
    defaultQuality: (Number(map.get("default_quality") ?? 1) as 1 | 2 | 3 | 4 | 5),
    setupFeeRate: Number(map.get("setup_fee_rate") ?? DEFAULT_SETTINGS.setupFeeRate),
    cacheTtlSeconds: Number(map.get("cache_ttl_seconds") ?? DEFAULT_SETTINGS.cacheTtlSeconds),
  };
}
