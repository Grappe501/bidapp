import * as cheerio from "cheerio";
import {
  CRAWLER_USER_AGENT,
  createRobotsCache,
  isPathAllowedByRules,
  parseRobotsTxt,
  selectRulesForCrawler,
  type RobotsCache,
} from "../lib/robots-utils";
import {
  classifyVendorPage,
  pageTypeEvidenceWeight,
  type VendorSitePageType,
} from "../lib/vendor-page-classification";
import { mergePageScores, scoreLinkForCrawl } from "../lib/vendor-site-discovery";
import {
  extractDomainFromUrl,
  isUrlAllowedForVendorCrawl,
  normalizeVendorWebsiteUrl,
} from "../lib/vendor-site-url";

const BINARY_PATH_RE =
  /\.(pdf|zip|png|jpe?g|gif|webp|svg|ico|mp4|mp3|woff2?|ttf|eot|dmg|exe)(\?|$)/i;
const SKIP_SCHEMES = /^(mailto|tel|javascript|ftp):/i;
const DEFAULT_MAX_PAGES = 18;
const DEFAULT_MAX_DEPTH = 2;
const REQUEST_DELAY_MS = 850;
const FETCH_TIMEOUT_MS = 25_000;

export type CrawledVendorPage = {
  url: string;
  urlNormalized: string;
  title: string | null;
  rawText: string;
  pageType: VendorSitePageType;
  crawlDepth: number;
  priorityScore: number;
  keptReason: string;
};

export type VendorSiteCrawlStats = {
  pagesDiscovered: number;
  pagesFetched: number;
  pagesSkippedRobots: number;
  pagesSkippedDuplicate: number;
  pagesSkippedOffDomain: number;
  pagesSkippedLowValue: number;
  pagesErrored: number;
  robotsOrigin?: string;
};

export type VendorSiteCrawlResult = {
  baseUrl: string;
  allowedHost: string;
  pages: CrawledVendorPage[];
  stats: VendorSiteCrawlStats;
  warnings: string[];
};

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

function stripHtml(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeUrlKey(u: URL): string {
  const c = new URL(u.href);
  c.hash = "";
  let s = c.href;
  if (c.pathname.length > 1 && c.pathname.endsWith("/")) {
    c.pathname = c.pathname.replace(/\/+$/, "");
    s = c.href;
  }
  return s;
}

async function fetchText(url: string): Promise<string> {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      signal: ctrl.signal,
      headers: {
        "User-Agent": `${CRAWLER_USER_AGENT}/1.0 (+BidApp vendor-site crawl)`,
        Accept: "text/html,application/xhtml+xml;q=0.9,*/*;q=0.8",
      },
      redirect: "follow",
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.text();
  } finally {
    clearTimeout(t);
  }
}

async function loadRobots(origin: string, cache: RobotsCache) {
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

type QueueItem = { url: URL; depth: number; score: number };

/**
 * Same-domain public crawl for a vendor marketing/docs site (robots-aware, rate-limited).
 */
export async function crawlVendorSite(input: {
  baseUrl: string;
  maxPages?: number;
  maxDepth?: number;
  delayMs?: number;
  forceRecrawl?: boolean;
}): Promise<VendorSiteCrawlResult> {
  const warnings: string[] = [];
  const normalized = normalizeVendorWebsiteUrl(input.baseUrl);
  if (!normalized) {
    throw new Error("Invalid vendor website URL");
  }
  const seed = new URL(normalized);
  const allowedHost = extractDomainFromUrl(normalized);
  if (!allowedHost) throw new Error("Could not determine domain");

  const maxPages = input.maxPages ?? DEFAULT_MAX_PAGES;
  const maxDepth = input.maxDepth ?? DEFAULT_MAX_DEPTH;
  const delayMs = input.delayMs ?? REQUEST_DELAY_MS;
  const robotsCache = createRobotsCache();

  const stats: VendorSiteCrawlStats = {
    pagesDiscovered: 0,
    pagesFetched: 0,
    pagesSkippedRobots: 0,
    pagesSkippedDuplicate: 0,
    pagesSkippedOffDomain: 0,
    pagesSkippedLowValue: 0,
    pagesErrored: 0,
  };

  const processed = new Set<string>();
  const scheduled = new Set<string>();
  const queue: QueueItem[] = [];

  const enqueue = (url: URL, depth: number, score: number) => {
    const key = normalizeUrlKey(url);
    if (scheduled.has(key) || processed.has(key)) {
      stats.pagesSkippedDuplicate++;
      return;
    }
    scheduled.add(key);
    stats.pagesDiscovered++;
    queue.push({ url, depth, score });
    queue.sort((a, b) => b.score - a.score);
  };

  enqueue(seed, 0, 100);

  const pages: CrawledVendorPage[] = [];

  while (queue.length > 0 && pages.length < maxPages) {
    const item = queue.shift();
    if (!item) break;
    const { url, depth } = item;
    const key = normalizeUrlKey(url);
    if (processed.has(key)) {
      stats.pagesSkippedDuplicate++;
      continue;
    }
    if (depth > maxDepth) continue;

    if (!isUrlAllowedForVendorCrawl(url, allowedHost)) {
      stats.pagesSkippedOffDomain++;
      scheduled.delete(key);
      continue;
    }

    const origin = `${url.protocol}//${url.host}`;
    const doc = await loadRobots(origin, robotsCache);
    const sel = selectRulesForCrawler(doc, CRAWLER_USER_AGENT);
    stats.robotsOrigin = origin;
    const pathForRobots = url.pathname + (url.search || "");
    if (!isPathAllowedByRules(pathForRobots, sel.rules)) {
      stats.pagesSkippedRobots++;
      processed.add(key);
      continue;
    }

    const waitMs =
      sel.crawlDelaySec != null
        ? Math.max(delayMs, Math.ceil(sel.crawlDelaySec * 1000))
        : delayMs;
    await sleep(waitMs);

    let html: string;
    try {
      html = await fetchText(url.href);
    } catch (e) {
      stats.pagesErrored++;
      warnings.push(
        e instanceof Error ? `${url.href}: ${e.message}` : String(e),
      );
      processed.add(key);
      continue;
    }

    stats.pagesFetched++;
    processed.add(key);

    const ct = html.trimStart();
    const text =
      ct.startsWith("<") || /<html[\s>]/i.test(ct.slice(0, 200))
        ? stripHtml(html)
        : html;
    const capped = text.slice(0, 400_000);
    if (capped.length < 80) {
      stats.pagesSkippedLowValue++;
      continue;
    }

    const $ = cheerio.load(html);
    const title = $("title").first().text().trim() || null;
    const pageType = classifyVendorPage({
      urlPath: url.pathname,
      title: title ?? "",
      textSample: capped,
    });
    const tw = pageTypeEvidenceWeight(pageType);
    if (pageType === "low_value_page" && depth > 0) {
      stats.pagesSkippedLowValue++;
      continue;
    }

    const priorityScore = mergePageScores(tw, item.score, depth);

    pages.push({
      url: url.href,
      urlNormalized: key,
      title,
      rawText: capped,
      pageType,
      crawlDepth: depth,
      priorityScore,
      keptReason: `type=${pageType}; score=${priorityScore.toFixed(0)}`,
    });

    if (depth >= maxDepth) continue;

    $("a[href]").each((_, el) => {
      const href = $(el).attr("href")?.trim();
      if (!href || SKIP_SCHEMES.test(href)) return;
      if (href.startsWith("#")) return;
      let next: URL;
      try {
        next = new URL(href, url.href);
      } catch {
        return;
      }
      if (!isUrlAllowedForVendorCrawl(next, allowedHost)) return;
      if (BINARY_PATH_RE.test(next.pathname)) return;
      const anchor = $(el).text().trim().slice(0, 120);
      const ls = scoreLinkForCrawl({
        hrefPath: next.pathname,
        anchorText: anchor,
        parentPageType: pageType,
      });
      const sc = mergePageScores(
        pageTypeEvidenceWeight(
          classifyVendorPage({
            urlPath: next.pathname,
            title: "",
            textSample: anchor,
          }),
        ),
        ls,
        depth + 1,
      );
      enqueue(next, depth + 1, sc);
    });
  }

  pages.sort((a, b) => b.priorityScore - a.priorityScore);

  return {
    baseUrl: normalized,
    allowedHost,
    pages: pages.slice(0, maxPages),
    stats,
    warnings,
  };
}
