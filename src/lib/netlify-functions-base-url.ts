/**
 * Base URL for Netlify Functions (`/.netlify/functions/*`).
 *
 * - **`VITE_FUNCTIONS_BASE_URL`** wins when set (any environment).
 * - **Production:** same origin as the SPA (Netlify hosts static + functions together).
 * - **Local dev:** plain `vite` runs on :5173 while functions run under `netlify dev`
 *   (default :8888). If we defaulted to `location.origin` on :5173, every fetch would
 *   hit Vite and return “Failed to fetch”. When the page is already on :8888,
 *   use same-origin.
 */
export function getNetlifyFunctionsBaseUrl(): string {
  const raw = (import.meta.env.VITE_FUNCTIONS_BASE_URL ?? "")
    .trim()
    .replace(/\/$/, "");
  if (raw) return raw;
  if (typeof window === "undefined" || !window.location?.origin) return "";

  const origin = window.location.origin;
  const port = window.location.port;
  const host = window.location.hostname;

  if (import.meta.env.PROD) return origin;

  if (port === "8888") {
    return origin;
  }
  if (host === "localhost" || host === "127.0.0.1") {
    return "http://localhost:8888";
  }
  return origin;
}
