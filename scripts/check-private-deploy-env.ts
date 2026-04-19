/**
 * Validates environment variables for a private / strict DB deployment.
 * Run from repo root: npx tsx scripts/check-private-deploy-env.ts
 * Loads `.env` when present (via dotenv).
 */
import "dotenv/config";

function fail(msg: string): never {
  console.error(`check-private-deploy-env: ${msg}`);
  process.exit(1);
}

const strict = process.env.STRICT_DB_MODE === "true";

const runtime = {
  DATABASE_URL: process.env.DATABASE_URL?.trim(),
  INTERNAL_API_KEY: process.env.INTERNAL_API_KEY?.trim(),
  ALLOWED_ORIGIN: process.env.ALLOWED_ORIGIN?.trim(),
  OPENAI_API_KEY: process.env.OPENAI_API_KEY?.trim(),
};

const build = {
  VITE_FUNCTIONS_BASE_URL: process.env.VITE_FUNCTIONS_BASE_URL?.trim(),
  VITE_DEFAULT_PROJECT_ID: process.env.VITE_DEFAULT_PROJECT_ID?.trim(),
  VITE_STRICT_DB_MODE: process.env.VITE_STRICT_DB_MODE?.trim(),
  VITE_INTERNAL_API_KEY: process.env.VITE_INTERNAL_API_KEY?.trim(),
};

if (strict) {
  if (!runtime.INTERNAL_API_KEY) {
    fail("STRICT_DB_MODE requires INTERNAL_API_KEY");
  }
  if (!runtime.ALLOWED_ORIGIN) {
    fail("STRICT_DB_MODE requires ALLOWED_ORIGIN (comma-separated exact origins, no *)");
  }
  if (!runtime.DATABASE_URL) {
    fail("STRICT_DB_MODE requires DATABASE_URL");
  }
}

if (!runtime.OPENAI_API_KEY) {
  console.warn(
    "check-private-deploy-env: OPENAI_API_KEY is unset — embed, parse, enrich, and draft generation will fail until set.",
  );
}

if (build.VITE_STRICT_DB_MODE === "true") {
  if (!build.VITE_FUNCTIONS_BASE_URL) {
    fail("VITE_STRICT_DB_MODE requires VITE_FUNCTIONS_BASE_URL");
  }
  if (!build.VITE_DEFAULT_PROJECT_ID) {
    fail("VITE_STRICT_DB_MODE requires VITE_DEFAULT_PROJECT_ID");
  }
  if (!build.VITE_INTERNAL_API_KEY) {
    fail("VITE_STRICT_DB_MODE requires VITE_INTERNAL_API_KEY (must match INTERNAL_API_KEY)");
  }
}

console.log("check-private-deploy-env: OK (see warnings above if any)");
