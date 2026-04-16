import Database from "better-sqlite3";
import { drizzle, type BetterSQLite3Database } from "drizzle-orm/better-sqlite3";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";
import { PATHS, ensureAppDirs } from "../lib/paths.js";
import * as schema from "./schema.js";
import { DEFAULT_SETTINGS } from "../types/settings.js";

let _db: BetterSQLite3Database<typeof schema> | null = null;
let _raw: Database.Database | null = null;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const MIGRATIONS_FOLDER = path.resolve(__dirname, "migrations");

export function getDb(): BetterSQLite3Database<typeof schema> {
  if (_db) return _db;
  ensureAppDirs();
  _raw = new Database(PATHS.db);
  _raw.pragma("journal_mode = WAL");
  _raw.pragma("foreign_keys = ON");
  _db = drizzle(_raw, { schema });
  runMigrations(_db);
  seedDefaultSettings(_raw);
  return _db;
}

function runMigrations(db: BetterSQLite3Database<typeof schema>): void {
  if (!fs.existsSync(MIGRATIONS_FOLDER)) return;
  migrate(db, { migrationsFolder: MIGRATIONS_FOLDER });
}

function seedDefaultSettings(raw: Database.Database): void {
  const stmt = raw.prepare("INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)");
  const entries: [string, string][] = [
    ["ui_language", DEFAULT_SETTINGS.uiLanguage],
    ["premium_status", String(DEFAULT_SETTINGS.premiumStatus)],
    ["server_region", DEFAULT_SETTINGS.serverRegion],
    ["default_quality", String(DEFAULT_SETTINGS.defaultQuality)],
    ["setup_fee_rate", String(DEFAULT_SETTINGS.setupFeeRate)],
    ["cache_ttl_seconds", String(DEFAULT_SETTINGS.cacheTtlSeconds)],
    ["db_schema_ver", "1"],
    ["last_seed_at", "0"],
  ];
  const tx = raw.transaction((rows: [string, string][]) => {
    for (const [k, v] of rows) stmt.run(k, v);
  });
  try {
    tx(entries);
  } catch {
    // table may not exist yet on first ever run before migrations (shouldn't happen in practice)
  }
}

export function closeDb(): void {
  if (_raw) {
    _raw.close();
    _raw = null;
    _db = null;
  }
}

export function rawDb(): Database.Database {
  getDb();
  if (!_raw) throw new Error("DB not initialized");
  return _raw;
}
