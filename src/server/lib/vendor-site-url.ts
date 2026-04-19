/**
 * Normalize vendor website URLs for storage and same-origin crawl roots.
 */

export function extractDomainFromUrl(url: string): string {
  try {
    const u = new URL(url.trim());
    return u.hostname.replace(/^www\./i, "").toLowerCase();
  } catch {
    return "";
  }
}

/** Returns normalized https URL or null if invalid / non-http(s). */
export function normalizeVendorWebsiteUrl(input: string): string | null {
  const raw = input.trim();
  if (!raw) return null;
  let candidate = raw;
  if (!/^https?:\/\//i.test(candidate)) {
    candidate = `https://${candidate}`;
  }
  try {
    const u = new URL(candidate);
    if (u.protocol !== "http:" && u.protocol !== "https:") return null;
    u.hash = "";
    u.username = "";
    u.password = "";
    let path = u.pathname;
    if (path.length > 1 && path.endsWith("/")) {
      path = path.slice(0, -1);
      u.pathname = path;
    }
    return u.href;
  } catch {
    return null;
  }
}

export function isUrlAllowedForVendorCrawl(
  target: URL,
  allowedHost: string,
): boolean {
  const h = target.hostname.replace(/^www\./i, "").toLowerCase();
  const base = allowedHost.replace(/^www\./i, "").toLowerCase();
  return h === base || h.endsWith(`.${base}`);
}
