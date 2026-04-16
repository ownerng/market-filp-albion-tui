import { getDb, closeDb } from "../src/db/client.js";
import { clearItems } from "../src/db/queries/items.js";
import { seedItems } from "../src/db/seed.js";

async function main() {
  getDb();
  console.log("Re-sembrando catálogo items.json...");
  clearItems();
  const res = await seedItems();
  console.log(
    `Descargados: ${res.downloaded} | Insertados: ${res.inserted} | Descartados: ${res.skipped}`,
  );
  closeDb();
}

main().catch((err) => {
  console.error("Error en reseed:", err);
  process.exit(1);
});
