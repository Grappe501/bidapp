import { readdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { query } from "./client";

const __dirname = dirname(fileURLToPath(import.meta.url));

async function ensureMigrationsTable(): Promise<void> {
  await query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      name text NOT NULL UNIQUE,
      applied_at timestamptz NOT NULL DEFAULT now(),
      created_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now()
    );
  `);
}

async function isApplied(name: string): Promise<boolean> {
  const r = await query<{ c: string }>(
    "SELECT COUNT(*)::text AS c FROM schema_migrations WHERE name = $1",
    [name],
  );
  return Number(r.rows[0]?.c ?? 0) > 0;
}

async function record(name: string): Promise<void> {
  await query(
    `INSERT INTO schema_migrations (name, updated_at) VALUES ($1, now()) ON CONFLICT (name) DO NOTHING`,
    [name],
  );
}

/**
 * Runs SQL files in src/server/db/migrations sorted by name.
 * Idempotent: each file applied at most once.
 */
export async function runMigrations(): Promise<string[]> {
  await ensureMigrationsTable();
  const dir = join(__dirname, "migrations");
  const files = readdirSync(dir)
    .filter((f) => f.endsWith(".sql"))
    .sort();
  const applied: string[] = [];

  for (const file of files) {
    if (await isApplied(file)) continue;
    const sql = readFileSync(join(dir, file), "utf8");
    await query(sql);
    await record(file);
    applied.push(file);
  }

  return applied;
}
