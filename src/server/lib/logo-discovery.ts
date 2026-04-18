import * as cheerio from "cheerio";

export type LogoSignal =
  | "og:image"
  | "twitter:image"
  | "icon"
  | "header-logo"
  | "filename-logo"
  | "svg"
  | "high-resolution";

export type LogoConfidenceLevel = "high" | "medium" | "low";

export type LogoCandidate = {
  url: string;
  score: number;
  signals: LogoSignal[];
  confidence: LogoConfidenceLevel;
};

export type LogoDiscoveryResult = {
  homepageTitle: string | null;
  brandImageUrl: string | null;
  preferredLogoUrl: string | null;
  logoCandidates: LogoCandidate[];
  logoConfidence: LogoConfidenceLevel | null;
  logoSignals: LogoSignal[];
};

function toAbsolute(raw: string | undefined, baseHref: string): string | null {
  if (!raw?.trim()) return null;
  try {
    const u = new URL(raw.trim(), baseHref);
    if (u.protocol !== "http:" && u.protocol !== "https:") return null;
    u.hash = "";
    return u.href;
  } catch {
    return null;
  }
}

function parseDimensions(
  w: string | undefined,
  h: string | undefined,
): { ratio: number | null; maxDim: number } {
  const nw = w ? parseInt(w, 10) : NaN;
  const nh = h ? parseInt(h, 10) : NaN;
  if (Number.isNaN(nw) || Number.isNaN(nh) || nw <= 0 || nh <= 0) {
    return { ratio: null, maxDim: 0 };
  }
  const ratio = nw / nh;
  return { ratio, maxDim: Math.max(nw, nh) };
}

function isNearSquare(ratio: number | null): boolean {
  if (ratio == null) return false;
  return ratio >= 0.85 && ratio <= 1.15;
}

function scoreFromSignals(
  url: string,
  signals: LogoSignal[],
): { score: number; confidence: LogoConfidenceLevel } {
  let score = 25;
  const lower = url.toLowerCase();
  const sigSet = new Set(signals);

  if (sigSet.has("filename-logo")) score += 28;
  if (sigSet.has("header-logo")) score += 22;
  if (sigSet.has("og:image")) score += 14;
  if (sigSet.has("twitter:image")) score += 12;
  if (sigSet.has("icon")) score += 10;
  if (sigSet.has("svg")) score += 8;
  if (sigSet.has("high-resolution")) score += 6;

  if (lower.includes("sprite") || lower.includes("placeholder")) score -= 25;
  if (lower.includes("hero") || lower.includes("banner")) score -= 12;

  const confidence = confidenceFromScore(score, sigSet);

  return { score, confidence };
}

function confidenceFromScore(
  score: number,
  sigSet: Set<LogoSignal>,
): LogoConfidenceLevel {
  if (score >= 72 && (sigSet.has("header-logo") || sigSet.has("filename-logo"))) {
    return "high";
  }
  if (score >= 52) return "medium";
  return "low";
}

function mergeCandidate(
  map: Map<string, LogoCandidate>,
  url: string,
  addSignals: LogoSignal[],
): void {
  const prev = map.get(url);
  const signals = new Set<LogoSignal>(prev?.signals ?? []);
  for (const s of addSignals) signals.add(s);
  const sigArr = [...signals];
  const { score, confidence } = scoreFromSignals(url, sigArr);
  const merged: LogoCandidate = { url, score, signals: sigArr, confidence };
  if (!prev || merged.score > prev.score) {
    map.set(url, merged);
  }
}

/**
 * Discover likely brand / logo image URLs from homepage HTML (heuristic + confidence).
 */
export function discoverBrandingAssetsFromHtml(
  html: string,
  pageUrl: string,
): LogoDiscoveryResult {
  const $ = cheerio.load(html);
  const baseHref = pageUrl;
  const byUrl = new Map<string, LogoCandidate>();

  const homepageTitle = $("title").first().text().trim() || null;

  const og = toAbsolute($('meta[property="og:image"]').attr("content"), baseHref);
  if (og) mergeCandidate(byUrl, og, ["og:image"]);

  const tw = toAbsolute($('meta[name="twitter:image"]').attr("content"), baseHref);
  if (tw) mergeCandidate(byUrl, tw, ["twitter:image"]);
  const tw2 = toAbsolute(
    $('meta[name="twitter:image:src"]').attr("content"),
    baseHref,
  );
  if (tw2) mergeCandidate(byUrl, tw2, ["twitter:image"]);

  $('link[rel="apple-touch-icon"], link[rel="apple-touch-icon-precomposed"]').each(
    (_, el) => {
      const href = toAbsolute($(el).attr("href"), baseHref);
      if (href) mergeCandidate(byUrl, href, ["icon"]);
    },
  );

  $('link[rel="icon"], link[rel="shortcut icon"]').each((_, el) => {
    const href = toAbsolute($(el).attr("href"), baseHref);
    if (href) mergeCandidate(byUrl, href, ["icon"]);
  });

  const header = $("header, .site-header, #header, .navbar, nav").first();
  const genericImgCount = $("img[src]").length;

  if (header.length) {
    header.find("img[src]").each((_, el) => {
      const $el = $(el);
      const src = toAbsolute($el.attr("src"), baseHref);
      if (!src) return;
      const alt = ($el.attr("alt") ?? "").toLowerCase();
      const cls = ($el.attr("class") ?? "").toLowerCase();
      const id = ($el.attr("id") ?? "").toLowerCase();
      const { ratio, maxDim } = parseDimensions(
        $el.attr("width"),
        $el.attr("height"),
      );
      const signals: LogoSignal[] = [];
      if (
        alt.includes("logo") ||
        cls.includes("logo") ||
        id.includes("logo") ||
        src.toLowerCase().includes("logo")
      ) {
        signals.push("header-logo");
      }
      if (src.toLowerCase().includes("logo")) signals.push("filename-logo");
      if (src.toLowerCase().endsWith(".svg") || src.includes(".svg?")) {
        signals.push("svg");
      }
      if (isNearSquare(ratio) && maxDim >= 64) signals.push("high-resolution");
      if (signals.length > 0) mergeCandidate(byUrl, src, signals);
    });
  }

  $("img[src]").each((_, el) => {
    const src = toAbsolute($(el).attr("src"), baseHref);
    if (!src) return;
    const lower = src.toLowerCase();
    if (!lower.includes("logo")) return;
    const signals: LogoSignal[] = ["filename-logo"];
    if (lower.endsWith(".svg") || lower.includes(".svg")) signals.push("svg");
    mergeCandidate(byUrl, src, signals);
  });

  if (genericImgCount > 25) {
    for (const c of byUrl.values()) {
      if (!c.signals.includes("header-logo") && c.signals.includes("og:image")) {
        c.score -= 6;
      }
    }
  }

  for (const c of byUrl.values()) {
    c.confidence = confidenceFromScore(c.score, new Set(c.signals));
  }

  const merged = [...byUrl.values()].sort((a, b) => b.score - a.score);

  const ogCand = merged.find((c) => c.signals.includes("og:image"));
  const brandImageUrl =
    ogCand?.url ??
    merged.find((c) => c.signals.includes("twitter:image"))?.url ??
    null;

  const iconPreferred =
    merged.find(
      (c) => c.signals.includes("icon") && c.score >= 48,
    ) ??
    merged.find((c) => c.signals.includes("icon"));

  let preferredLogoUrl: string | null = null;
  if (iconPreferred && iconPreferred.confidence !== "low") {
    preferredLogoUrl = iconPreferred.url;
  } else {
    const logoish = merged.find(
      (c) =>
        c.signals.includes("filename-logo") ||
        c.signals.includes("header-logo"),
    );
    preferredLogoUrl = logoish?.url ?? iconPreferred?.url ?? null;
  }

  const top = merged[0];
  const chosen =
    preferredLogoUrl != null
      ? merged.find((c) => c.url === preferredLogoUrl) ?? top
      : top;
  const logoConfidence = chosen ? chosen.confidence : null;
  const logoSignals = chosen ? chosen.signals : [];

  return {
    homepageTitle,
    brandImageUrl,
    preferredLogoUrl,
    logoCandidates: merged.slice(0, 12),
    logoConfidence,
    logoSignals,
  };
}
