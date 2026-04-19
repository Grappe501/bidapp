import { getNetlifyFunctionsBaseUrl } from "@/lib/netlify-functions-base-url";

/**
 * Client-visible configuration for DB-first mode.
 * Server secrets (e.g. DATABASE_URL) are not available here — configure those on Netlify.
 */
export function getMissingClientEnvVars(): string[] {
  const missing: string[] = [];
  if (!getNetlifyFunctionsBaseUrl()) {
    missing.push("VITE_FUNCTIONS_BASE_URL");
  }
  if (!(import.meta.env.VITE_DEFAULT_PROJECT_ID ?? "").trim()) {
    missing.push("VITE_DEFAULT_PROJECT_ID");
  }
  if (import.meta.env.VITE_STRICT_DB_MODE === "true") {
    if (!(import.meta.env.VITE_INTERNAL_API_KEY ?? "").trim()) {
      missing.push("VITE_INTERNAL_API_KEY");
    }
  }
  return missing;
}

export function isStrictDbModeClient(): boolean {
  return import.meta.env.VITE_STRICT_DB_MODE === "true";
}
