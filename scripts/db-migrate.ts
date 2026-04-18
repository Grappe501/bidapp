import "dotenv/config";

import { runMigrations } from "../src/server/db/migrate";
import { closePool } from "../src/server/db/client";

async function main() {
  const applied = await runMigrations();
  console.log(
    applied.length
      ? `Applied migrations: ${applied.join(", ")}`
      : "Database already up to date.",
  );
  await closePool();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
