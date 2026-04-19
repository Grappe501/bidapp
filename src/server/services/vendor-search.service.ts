/**
 * Optional web search for vendor research. Uses Serper (Google) when SERPER_API_KEY is set.
 */

export type VendorSearchHit = { title: string; url: string; snippet?: string };

export function isVendorSearchConfigured(): boolean {
  return Boolean(process.env.SERPER_API_KEY?.trim());
}

export async function searchWeb(query: string): Promise<VendorSearchHit[]> {
  const key = process.env.SERPER_API_KEY?.trim();
  if (!key) {
    return [];
  }
  const res = await fetch("https://google.serper.dev/search", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-API-KEY": key,
    },
    body: JSON.stringify({ q: query, num: 10 }),
  });
  if (!res.ok) {
    throw new Error(`Serper search failed: ${res.status}`);
  }
  const data = (await res.json()) as {
    organic?: Array<{ title?: string; link?: string; snippet?: string }>;
  };
  const organic = Array.isArray(data.organic) ? data.organic : [];
  return organic
    .map((o) => ({
      title: String(o.title ?? "").trim(),
      url: String(o.link ?? "").trim(),
      snippet: o.snippet ? String(o.snippet) : undefined,
    }))
    .filter((o) => o.url.startsWith("http"));
}
