import * as cheerio from "cheerio";
import { discoverBrandingAssetsFromHtml } from "../lib/logo-discovery";
import {
  CRAWLER_USER_AGENT,
  createRobotsCache,
  isPathAllowedByRules,
  parseRobotsTxt,
  selectRulesForCrawler,
  type ParsedRobotsDocument,
  type RobotsCache,
  type RobotsSelectionMeta,
} from "../lib/robots-utils";
import {
  getCompanyProfile,
  mergeCompanyProfileBrandingMeta,
  updateCompanyProfileSummaryIfEmpty,
  upsertIntelligenceSourceWebsiteScrape,
  type DbCompanyProfile,
  type DbIntelligenceSource,
} from "../repositories/intelligence.repo";

const SEED_URL = "https://www.allcarepharmacy.com/";
const MAX_DEPTH = 2;
const MAX_PAGES = 20;
const REQUEST_DELAY_MS = 900;
const FETCH_TIMEOUT_MS = 25_000;

const BINARY_PATH_RE =
  /\.(pdf|zip|png|jpe?g|gif|webp|svg|ico|mp4|mp3|woff2?|ttf|eot|dmg|exe)(\?|$)/i;

const SKIP_SCHEMES = /^(mailto|tel|javascript|ftp):/i;

export type AllCarePageLabel =
  | "homepage"
  | "service_line_longterm_care"
  | "service_line_assisted_living"
  | "service_line_correctional"
  | "service_line_specialty"
  | "privacy"
  | "contact"
  | "technology"
  | "other";

export type LogoDiscoveryResult = ReturnType<
  typeof discoverBrandingAssetsFromHtml
>;

export type ScrapedAllCarePage = {
  url: string;
  urlNormalized: string;
  title: string | null;
  capturedText: string;
  pageLabel: AllCarePageLabel;
  metadata: Record<string, unknown>;
  logoDiscovery?: LogoDiscoveryResult;
};

export type AllCareCrawlStats = {
  pagesDiscovered: number;
  pagesFetched: number;
  pagesSkippedRobots: number;
  pagesSkippedDuplicate: number;
  pagesErrored: number;
  /** When loading from DB instead of network (forceRecrawl: false). */
  pagesLoadedFromStore: number;
  /**
   * Last robots.txt User-agent block applied during HTTP crawl (observability).
   * Undefined when reusing stored pages only.
   */
  robotsSelection?: RobotsSelectionMeta & { origin: string };
};

export type AllCareCrawlResult = {
  pages: ScrapedAllCarePage[];
  stats: AllCareCrawlStats;
};

export type AllCareCrawlOptions = {
  maxDepth?: number;
  maxPages?: number;
  delayMs?: number;
  dryRun?: boolean;
  /** Fresh robots cache for this run (one per crawl). */
  robotsCache?: RobotsCache;
};

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

export function normalizeAllCareUrl(u: string, base?: string): URL | null {
  try {
    const url = new URL(u.trim(), base ?? SEED_URL);
    if (url.protocol !== "http:" && url.protocol !== "https:") return null;
    url.hash = "";
    url.hostname = url.hostname.toLowerCase();
    if (url.pathname.length > 1 && url.pathname.endsWith("/")) {
      url.pathname = url.pathname.replace(/\/+$/, "/").replace(/\/$/, "");
    }
    return url;
  } catch {
    return null;
  }
}

export function isAllowedAllCareHost(hostname: string): boolean {
  const h = hostname.toLowerCase();
  return h === "allcarepharmacy.com" || h.endsWith(".allcarepharmacy.com");
}

export function urlNormalizedString(url: URL): string {
  const copy = new URL(url.href);
  copy.hash = "";
  return copy.href;
}

async function fetchText(url: string): Promise<string> {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      signal: ctrl.signal,
      headers: {
        "User-Agent": `${CRAWLER_USER_AGENT}/1.0 (+BidApp AllCare ingest; same-domain)`,
        Accept: "text/html,application/xhtml+xml;q=0.9,*/*;q=0.8",
      },
    });
    if (!res.ok) {
      throw new Error(`HTTP ${res.status} for ${url}`);
    }
    return await res.text();
  } finally {
    clearTimeout(t);
  }
}

async function loadParsedRobotsForOrigin(
  origin: string,
  cache: RobotsCache,
): Promise<ParsedRobotsDocument> {
  const hit = cache.get(origin);
  if (hit) return hit;
  try {
    const txt = await fetchText(`${origin}/robots.txt`);
    const doc = parseRobotsTxt(txt);
    cache.set(origin, doc);
    return doc;
  } catch {
    const doc = parseRobotsTxt("");
    cache.set(origin, doc);
    return doc;
  }
}

function delayForOrigin(
  baseDelayMs: number,
  crawlDelaySec: number | null,
): number {
  if (crawlDelaySec == null) return baseDelayMs;
  return Math.max(baseDelayMs, Math.ceil(crawlDelaySec * 1000));
}

export function inferAllCarePageLabel(input: {
  url: URL;
  title: string;
  textSample: string;
}): AllCarePageLabel {
  const path = input.url.pathname.toLowerCase();
  const blob = `${path} ${input.title.toLowerCase()} ${input.textSample.slice(0, 4000).toLowerCase()}`;

  if (path === "/" || path === "") return "homepage";
  if (blob.includes("privacy") || path.includes("privacy")) return "privacy";
  if (
    blob.includes("contact") ||
    path.includes("contact") ||
    path.includes("location")
  ) {
    return "contact";
  }
  if (
    blob.includes("assisted living") ||
    path.includes("assisted") ||
    blob.includes("assisted-living")
  ) {
    return "service_line_assisted_living";
  }
  if (
    blob.includes("correctional") ||
    path.includes("correctional") ||
    blob.includes("corrections")
  ) {
    return "service_line_correctional";
  }
  if (
    blob.includes("specialty") ||
    path.includes("specialty") ||
    blob.includes("specialty pharmacy")
  ) {
    return "service_line_specialty";
  }
  if (
    blob.includes("long-term") ||
    blob.includes("long term") ||
    blob.includes("longterm") ||
    blob.includes("ltc") ||
    blob.includes("skilled nursing") ||
    path.includes("long-term") ||
    path.includes("longterm")
  ) {
    return "service_line_longterm_care";
  }
  if (
    blob.includes("exactmed") ||
    blob.includes("imar") ||
    blob.includes("facility management") ||
    blob.includes("technology") ||
    path.includes("technology")
  ) {
    return "technology";
  }
  return "other";
}

function extractFromHtml(html: string): {
  title: string | null;
  canonical: string | null;
  text: string;
  links: string[];
} {
  const $ = cheerio.load(html);
  $("script, style, noscript, svg").remove();
  const title = $("title").first().text().trim() || null;
  const canonical =
    $('link[rel="canonical"]').attr("href")?.trim() || null;
  const text = $("body").text().replace(/\s+/g, " ").trim();
  const links: string[] = [];
  $("a[href]").each((_, el) => {
    const href = $(el).attr("href");
    if (href) links.push(href);
  });
  return { title, canonical, text, links };
}

function shouldSkipHref(pathname: string, href: string): boolean {
  if (SKIP_SCHEMES.test(href)) return true;
  if (BINARY_PATH_RE.test(pathname)) return true;
  return false;
}

function isSeedHomepage(url: URL): boolean {
  const seed = normalizeAllCareUrl(SEED_URL);
  if (!seed) return false;
  return (
    url.hostname === seed.hostname &&
    (url.pathname === "/" || url.pathname === "")
  );
}

/**
 * Same-domain crawl for AllCare public marketing site. Does not write to DB.
 */
export async function crawlAllCarePublicSite(
  options: AllCareCrawlOptions = {},
): Promise<AllCareCrawlResult> {
  const maxDepth = options.maxDepth ?? MAX_DEPTH;
  const maxPages = options.maxPages ?? MAX_PAGES;
  const baseDelayMs = options.delayMs ?? REQUEST_DELAY_MS;
  const robotsCache = options.robotsCache ?? createRobotsCache();

  const stats: AllCareCrawlStats = {
    pagesDiscovered: 0,
    pagesFetched: 0,
    pagesSkippedRobots: 0,
    pagesSkippedDuplicate: 0,
    pagesErrored: 0,
    pagesLoadedFromStore: 0,
  };

  const seed = normalizeAllCareUrl(SEED_URL);
  if (!seed || !isAllowedAllCareHost(seed.hostname)) {
    throw new Error("Invalid seed URL for AllCare crawl");
  }

  const processed = new Set<string>();
  const scheduled = new Set<string>();
  const results: ScrapedAllCarePage[] = [];

  const queue: { url: URL; depth: number }[] = [];

  const enqueue = (url: URL, depth: number) => {
    const key = urlNormalizedString(url);
    if (scheduled.has(key)) {
      stats.pagesSkippedDuplicate++;
      return;
    }
    scheduled.add(key);
    stats.pagesDiscovered++;
    queue.push({ url, depth });
  };

  enqueue(seed, 0);

  while (queue.length > 0 && results.length < maxPages) {
    const item = queue.shift();
    if (!item) break;
    const { url, depth } = item;
    const key = urlNormalizedString(url);
    if (processed.has(key)) {
      stats.pagesSkippedDuplicate++;
      continue;
    }

    const origin = `${url.protocol}//${url.host}`;
    const doc = await loadParsedRobotsForOrigin(origin, robotsCache);
    const sel = selectRulesForCrawler(doc, CRAWLER_USER_AGENT);
    const { rules, crawlDelaySec } = sel;
    stats.robotsSelection = {
      ...sel.selectionMeta,
      origin,
    };
    const waitMs = delayForOrigin(baseDelayMs, crawlDelaySec);

    if (!isPathAllowedByRules(url.pathname, rules)) {
      stats.pagesSkippedRobots++;
      continue;
    }

    let html: string;
    try {
      html = await fetchText(url.href);
    } catch {
      stats.pagesErrored++;
      await sleep(waitMs);
      continue;
    }

    processed.add(key);
    stats.pagesFetched++;

    const { title, canonical, text, links } = extractFromHtml(html);
    const pageLabel = inferAllCarePageLabel({
      url,
      title: title ?? "",
      textSample: text,
    });

    const metaUrl = canonical
      ? normalizeAllCareUrl(canonical, url.href)
      : null;
    const effectiveUrl = metaUrl ?? url;

    const page: ScrapedAllCarePage = {
      url: effectiveUrl.href,
      urlNormalized: urlNormalizedString(effectiveUrl),
      title,
      capturedText: text,
      pageLabel,
      metadata: {
        page_label: pageLabel,
        ingest: "allcare_public_site",
        crawl_depth: depth,
      },
    };

    if (isSeedHomepage(url) && pageLabel === "homepage") {
      const logo = discoverBrandingAssetsFromHtml(html, url.href);
      page.logoDiscovery = logo;
      if (logo.homepageTitle && !page.title) {
        page.title = logo.homepageTitle;
      }
    }

    results.push(page);

    if (depth >= maxDepth) {
      await sleep(waitMs);
      continue;
    }

    for (const href of links) {
      if (results.length + queue.length >= maxPages * 4) break;
      if (shouldSkipHref("", href)) continue;
      const next = normalizeAllCareUrl(href, url.href);
      if (!next || !isAllowedAllCareHost(next.hostname)) continue;
      if (shouldSkipHref(next.pathname, href)) continue;
      const nextOrigin = `${next.protocol}//${next.host}`;
      const nextDoc = await loadParsedRobotsForOrigin(nextOrigin, robotsCache);
      const nextEff = selectRulesForCrawler(nextDoc, CRAWLER_USER_AGENT);
      stats.robotsSelection = {
        ...nextEff.selectionMeta,
        origin: nextOrigin,
      };
      if (!isPathAllowedByRules(next.pathname, nextEff.rules)) {
        stats.pagesSkippedRobots++;
        continue;
      }
      enqueue(next, depth + 1);
    }

    await sleep(waitMs);
  }

  return {
    pages: results.slice(0, maxPages),
    stats,
  };
}

/** Rehydrate pseudo pages from stored website_scrape rows (no HTTP). */
export function dbWebsiteScrapeSourcesToPages(
  sources: DbIntelligenceSource[],
): ScrapedAllCarePage[] {
  return sources
    .filter((s) => s.sourceType === "website_scrape")
    .map((s) => ({
      url: s.url ?? "",
      urlNormalized: s.urlNormalized ?? s.url ?? "",
      title: s.title,
      capturedText: s.rawText,
      pageLabel: (s.classification as AllCarePageLabel) || "other",
      metadata: { ...s.metadata, from_stored_source: true },
    }));
}

export type PersistScrapePagesResult = {
  sources: DbIntelligenceSource[];
  pagesPersisted: number;
};

export async function persistAllCareScrapedPages(input: {
  projectId: string;
  companyProfileId: string;
  pages: ScrapedAllCarePage[];
}): Promise<PersistScrapePagesResult> {
  const sources: DbIntelligenceSource[] = [];
  const now = new Date().toISOString();
  for (const p of input.pages) {
    const row = await upsertIntelligenceSourceWebsiteScrape({
      projectId: input.projectId,
      companyProfileId: input.companyProfileId,
      url: p.url,
      urlNormalized: p.urlNormalized,
      title: p.title,
      rawText: p.capturedText,
      classification: p.pageLabel,
      metadata: {
        ...p.metadata,
        page_label: p.pageLabel,
      },
      fetchedAt: now,
    });
    sources.push(row);
  }
  return { sources, pagesPersisted: sources.length };
}

export async function mergeLogoDiscoveryIntoProfile(input: {
  profileId: string;
  discovery: LogoDiscoveryResult | null | undefined;
}): Promise<{ logoDiscovered: boolean }> {
  if (!input.discovery) return { logoDiscovered: false };
  const p = await getCompanyProfile(input.profileId);
  if (!p) return { logoDiscovered: false };

  const meta = p.brandingMeta ?? {};
  const hasManualLogo =
    typeof meta.logo_url === "string" &&
    meta.logo_url.trim().toLowerCase().startsWith("http");

  const patch: Record<string, unknown> = {
    logo_candidates: input.discovery.logoCandidates,
    homepage_title:
      input.discovery.homepageTitle ??
      (typeof meta.homepage_title === "string" ? meta.homepage_title : null),
    logo_confidence: input.discovery.logoConfidence ?? null,
    logo_signals: input.discovery.logoSignals ?? [],
  };
  if (input.discovery.brandImageUrl) {
    patch.brand_image_url = input.discovery.brandImageUrl;
  }
  if (!hasManualLogo && input.discovery.preferredLogoUrl) {
    patch.logo_url = input.discovery.preferredLogoUrl;
  }

  await mergeCompanyProfileBrandingMeta({ id: input.profileId, patch });

  const logoDiscovered = Boolean(
    input.discovery.preferredLogoUrl || input.discovery.brandImageUrl,
  );
  return { logoDiscovered };
}

export async function recordAllCareScrapeBrandingMeta(input: {
  profile: DbCompanyProfile;
  pagesScraped: number;
  lastFetchedAt: string;
  scrapeSummary?: Record<string, unknown>;
}): Promise<void> {
  const patch: Record<string, unknown> = {
    allcare_last_scrape_at: input.lastFetchedAt,
    allcare_pages_scraped: input.pagesScraped,
    allcare_pages_scraped_total: input.pagesScraped,
  };
  if (input.scrapeSummary && Object.keys(input.scrapeSummary).length > 0) {
    patch.allcare_last_scrape_summary = input.scrapeSummary;
  }
  await mergeCompanyProfileBrandingMeta({
    id: input.profile.id,
    patch,
  });
}

export async function maybeEnrichSummaryFromHomepage(input: {
  profileId: string;
  pages: ScrapedAllCarePage[];
}): Promise<void> {
  const home = input.pages.find((p) => p.pageLabel === "homepage");
  if (!home || home.capturedText.length < 40) return;
  const snippet = home.capturedText.slice(0, 1200).trim();
  await updateCompanyProfileSummaryIfEmpty({
    id: input.profileId,
    summary: snippet,
  });
}
