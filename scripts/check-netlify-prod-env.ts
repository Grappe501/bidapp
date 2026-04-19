/**
 * Local preflight: required variables for a Netlify **production**-style private deploy.
 * Loads `.env` when present. Does not connect to Netlify APIs or remote DB.
 *
 *   npm run check:netlify-prod-env
 *
 * Fails fast on missing required keys. Warns if `OPENAI_API_KEY` is unset.
 */
import "dotenv/config";

function fail(msg: string): never {
  console.error(`check-netlify-prod-env: ${msg}`);
  process.exit(1);
}

const req = {
  DATABASE_URL: process.env.DATABASE_URL?.trim(),
  INTERNAL_API_KEY: process.env.INTERNAL_API_KEY?.trim(),
  ALLOWED_ORIGIN: process.env.ALLOWED_ORIGIN?.trim(),
  VITE_FUNCTIONS_BASE_URL: process.env.VITE_FUNCTIONS_BASE_URL?.trim(),
  VITE_DEFAULT_PROJECT_ID: process.env.VITE_DEFAULT_PROJECT_ID?.trim(),
  VITE_STRICT_DB_MODE: process.env.VITE_STRICT_DB_MODE?.trim(),
  VITE_INTERNAL_API_KEY: process.env.VITE_INTERNAL_API_KEY?.trim(),
};

if (!req.DATABASE_URL) fail("DATABASE_URL is required");
if (!req.INTERNAL_API_KEY) fail("INTERNAL_API_KEY is required");
if (!req.ALLOWED_ORIGIN) fail("ALLOWED_ORIGIN is required (exact production origin(s), comma-separated)");
if (!req.VITE_FUNCTIONS_BASE_URL) fail("VITE_FUNCTIONS_BASE_URL is required");
if (!req.VITE_DEFAULT_PROJECT_ID) fail("VITE_DEFAULT_PROJECT_ID is required");
if (req.VITE_STRICT_DB_MODE !== "true") {
  fail("VITE_STRICT_DB_MODE must be true for production private deploy (matches STRICT_DB_MODE on functions)");
}
if (!req.VITE_INTERNAL_API_KEY) {
  fail("VITE_INTERNAL_API_KEY is required (must match INTERNAL_API_KEY for this private model)");
}

if (!process.env.OPENAI_API_KEY?.trim()) {
  console.warn(
    "check-netlify-prod-env: OPENAI_API_KEY is unset — AI functions will fail until set on the Netlify functions runtime.",
  );
}

if (process.env.STRICT_DB_MODE !== "true") {
  console.warn(
    "check-netlify-prod-env: STRICT_DB_MODE is not true — set it on Netlify functions for production private deploy.",
  );
}

console.log("check-netlify-prod-env: required keys present (see warnings above if any).");
console.log(
  "Next: confirm Netlify UI has the same values (Build vs Functions contexts), then follow scripts/netlify-deploy-checklist.md",
);
