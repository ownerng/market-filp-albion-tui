import { defineConfig } from "drizzle-kit";
import path from "node:path";
import os from "node:os";

const dbPath = path.join(os.homedir(), ".market-flip", "market-flip.db");

export default defineConfig({
  dialect: "sqlite",
  schema: "./src/db/schema.ts",
  out: "./src/db/migrations",
  dbCredentials: { url: dbPath },
  verbose: true,
  strict: true,
});
