/**
 * Base URL for Netlify Functions (`/.netlify/functions/*`).
 * Prefer `VITE_FUNCTIONS_BASE_URL` when set (e.g. local `netlify dev` on :8888
 * while Vite serves on :5173). When unset in the browser, use the current
 * origin so production deploys on Netlify work without duplicating the site URL.
 */
export function getNetlifyFunctionsBaseUrl(): string {
  const raw = (import.meta.env.VITE_FUNCTIONS_BASE_URL ?? "")
    .trim()
    .replace(/\/$/, "");
  if (raw) return raw;
  if (typeof window !== "undefined" && window.location?.origin) {
    return window.location.origin;
  }
  return "";
}
