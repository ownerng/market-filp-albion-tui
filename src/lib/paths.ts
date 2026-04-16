import path from "node:path";
import os from "node:os";
import fs from "node:fs";

const ROOT = path.join(os.homedir(), ".market-flip");

export const PATHS = {
  root: ROOT,
  db: path.join(ROOT, "market-flip.db"),
  log: path.join(ROOT, "app.log"),
  migrations: path.join(ROOT, "migrations"),
};

export function ensureAppDirs(): void {
  if (!fs.existsSync(PATHS.root)) {
    fs.mkdirSync(PATHS.root, { recursive: true });
  }
}
