import pg from "pg";

const { Pool } = pg;

let pool: pg.Pool | null = null;

function connectionString(): string {
  const url = process.env.DATABASE_URL;
  if (!url || url.trim() === "") {
    throw new Error("DATABASE_URL is not set");
  }
  return url;
}

/**
 * Shared pool for serverless (single connection per invocation is safest).
 * Increase max only in long-running Node processes.
 */
export function getPool(): pg.Pool {
  if (!pool) {
    pool = new Pool({
      connectionString: connectionString(),
      max: Number(process.env.PG_POOL_MAX ?? 5),
      idleTimeoutMillis: 30_000,
      connectionTimeoutMillis: 10_000,
      ssl:
        process.env.PGSSLMODE === "disable"
          ? false
          : { rejectUnauthorized: false },
    });
    pool.on("error", (err) => {
      console.error("Unexpected PG pool error", err);
    });
  }
  return pool;
}

export async function query<T extends pg.QueryResultRow = pg.QueryResultRow>(
  text: string,
  params?: unknown[],
): Promise<pg.QueryResult<T>> {
  const p = getPool();
  try {
    return await p.query<T>(text, params);
  } catch (e) {
    console.error("query error", { text: text.slice(0, 200), e });
    throw e;
  }
}

export async function closePool(): Promise<void> {
  if (pool) {
    await pool.end();
    pool = null;
  }
}
