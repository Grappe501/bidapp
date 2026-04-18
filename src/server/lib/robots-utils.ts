/**
 * robots.txt parsing with multi-agent blocks, Crawl-delay per block, and
 * path rules: longest prefix wins; equal length → Allow overrides Disallow.
 *
 * ## User-agent matching (conservative, explainable — not a full RFC 9309 engine)
 *
 * **Supported**
 * - Exact: block UA string equals crawler UA (case-insensitive).
 * - Substring: crawler contains block token or block contains crawler (e.g. "Googlebot" vs "Googlebot-News").
 * - Wildcard token: block contains `*` — only `*inner*` is supported: inner non-empty substring must appear
 *   in the crawler UA (e.g. `*bot*` matches `BidAppBot`). Multiple `*` collapse to one inner token.
 * - Fallback `User-agent: *` block.
 *
 * **Not supported (by design)**
 * - Full glob / regex UA patterns, `$` end anchors, or Google-specific group extensions.
 * - Multiple wildcards with disjoint segments; only the collapsed inner substring is used.
 * - Host-specific or sitemap directives for crawl permission (sitemap lines are not parsed here).
 */

export const CRAWLER_USER_AGENT = "BidAppBot";

export type RobotsRule = {
  kind: "allow" | "disallow";
  prefix: string;
  order: number;
};

export type RobotsAgentBlock = {
  userAgent: string;
  allow: string[];
  disallow: string[];
  rules: RobotsRule[];
  crawlDelaySec: number | null;
};

export type ParsedRobotsDocument = {
  blocks: RobotsAgentBlock[];
};

/** How the winning User-agent block was chosen for this crawler. */
export type RobotsUserAgentMatchRule =
  | "exact"
  | "substring"
  | "wildcard"
  | "star";

export type RobotsSelectionMeta = {
  /** Normalized rule kind for observability (exact → substring → wildcard → star fallback). */
  matchRuleType: RobotsUserAgentMatchRule;
  /** `User-agent:` value from the winning block (or `*`). */
  ruleSourceUserAgent: string;
  matchedAgent: string;
  crawlDelaySec: number | null;
};

function trimPath(p: string): string {
  const s = p.trim().split("#")[0]?.split("?")[0] ?? "";
  if (!s) return "";
  return s.startsWith("/") ? s : `/${s}`;
}

/**
 * Parse full robots.txt into ordered user-agent blocks.
 * Directives before the first User-agent belong to no block and are ignored.
 */
export function parseRobotsTxt(body: string): ParsedRobotsDocument {
  const blocks: RobotsAgentBlock[] = [];
  let currentUa: string | null = null;
  const allow: string[] = [];
  const disallow: string[] = [];
  const ordered: { kind: "allow" | "disallow"; value: string }[] = [];
  let crawlDelaySec: number | null = null;

  const flush = () => {
    if (currentUa == null) return;
    const rules: RobotsRule[] = [];
    let order = 0;
    for (const d of ordered) {
      const prefix = d.value === "" ? "" : trimPath(d.value);
      if (prefix === "") continue;
      rules.push({ kind: d.kind, prefix, order: order++ });
    }
    blocks.push({
      userAgent: currentUa,
      allow: [...allow],
      disallow: [...disallow],
      rules,
      crawlDelaySec,
    });
    allow.length = 0;
    disallow.length = 0;
    ordered.length = 0;
    crawlDelaySec = null;
  };

  for (const line of body.split(/\r?\n/)) {
    const raw = line.trim();
    if (!raw || raw.startsWith("#")) continue;

    const ua = /^user-agent:\s*(.*)$/i.exec(raw);
    if (ua) {
      flush();
      currentUa = ua[1].trim();
      continue;
    }
    if (currentUa == null) continue;

    const disallowM = /^disallow:\s*(.*)$/i.exec(raw);
    if (disallowM) {
      const v = disallowM[1].trim();
      disallow.push(v);
      ordered.push({ kind: "disallow", value: v });
      continue;
    }

    const allowM = /^allow:\s*(.*)$/i.exec(raw);
    if (allowM) {
      const v = allowM[1].trim();
      allow.push(v);
      ordered.push({ kind: "allow", value: v });
      continue;
    }

    const cd = /^crawl-delay:\s*([\d.]+)\s*$/i.exec(raw);
    if (cd) {
      const n = Number(cd[1]);
      if (!Number.isNaN(n) && n >= 0) crawlDelaySec = n;
    }
  }
  flush();

  return { blocks };
}

type BlockMatch = {
  score: number;
  matchRuleType: RobotsUserAgentMatchRule;
};

/**
 * Score for choosing a User-agent block. Higher wins.
 * `star` is lowest priority among real blocks; explicit `*` UA uses star rule type.
 */
function blockMatchScore(
  crawlerUa: string,
  blockUa: string,
): BlockMatch {
  const c = crawlerUa.trim().toLowerCase();
  const b = blockUa.trim().toLowerCase();
  if (b === "*") return { score: 1, matchRuleType: "star" };
  if (b === c) return { score: 1000 + b.length, matchRuleType: "exact" };
  if (b.includes("*")) {
    const inner = b.replace(/\*/g, "");
    if (inner.length === 0) return { score: 1, matchRuleType: "star" };
    if (c.includes(inner)) {
      return {
        score: 500 + Math.min(inner.length, c.length),
        matchRuleType: "wildcard",
      };
    }
    return { score: 0, matchRuleType: "wildcard" };
  }
  if (c.includes(b) || b.includes(c)) {
    return {
      score: 500 + Math.min(b.length, c.length),
      matchRuleType: "substring",
    };
  }
  return { score: 0, matchRuleType: "substring" };
}

/**
 * Pick the best robots block for this crawler (exact → substring/wildcard → *).
 * Returns path rules, crawl-delay from that block, and **selection metadata** for logging / scrape summaries.
 */
export function selectRulesForCrawler(
  doc: ParsedRobotsDocument,
  crawlerUa: string = CRAWLER_USER_AGENT,
): {
  rules: RobotsRule[];
  crawlDelaySec: number | null;
  matchedAgent: string;
  selectionMeta: RobotsSelectionMeta;
} {
  let best: RobotsAgentBlock | null = null;
  let bestScore = -1;
  let bestRuleType: RobotsUserAgentMatchRule = "star";

  for (const block of doc.blocks) {
    const { score, matchRuleType } = blockMatchScore(crawlerUa, block.userAgent);
    if (score > bestScore) {
      bestScore = score;
      best = block;
      bestRuleType = matchRuleType;
    } else if (score === bestScore && best && block.userAgent.length > best.userAgent.length) {
      best = block;
      bestRuleType = matchRuleType;
    }
  }

  if (!best || bestScore <= 0) {
    const star = doc.blocks.find((x) => x.userAgent.trim() === "*");
    if (star) {
      const meta: RobotsSelectionMeta = {
        matchRuleType: "star",
        ruleSourceUserAgent: "*",
        matchedAgent: "*",
        crawlDelaySec: star.crawlDelaySec,
      };
      return {
        rules: star.rules,
        crawlDelaySec: star.crawlDelaySec,
        matchedAgent: "*",
        selectionMeta: meta,
      };
    }
    const meta: RobotsSelectionMeta = {
      matchRuleType: "star",
      ruleSourceUserAgent: "*",
      matchedAgent: "*",
      crawlDelaySec: null,
    };
    return { rules: [], crawlDelaySec: null, matchedAgent: "*", selectionMeta: meta };
  }

  const meta: RobotsSelectionMeta = {
    matchRuleType: bestRuleType,
    ruleSourceUserAgent: best.userAgent,
    matchedAgent: best.userAgent,
    crawlDelaySec: best.crawlDelaySec,
  };

  return {
    rules: best.rules,
    crawlDelaySec: best.crawlDelaySec,
    matchedAgent: best.userAgent,
    selectionMeta: meta,
  };
}

export function pathMatchesRule(urlPath: string, rulePrefix: string): boolean {
  const path = urlPath.startsWith("/") ? urlPath : `/${urlPath}`;
  const rp = rulePrefix;
  if (rp === "" || rp === "/") {
    return true;
  }
  return path === rp || path.startsWith(`${rp}/`);
}

function matchingRules(urlPath: string, rules: RobotsRule[]): RobotsRule[] {
  return rules.filter((r) => pathMatchesRule(urlPath, r.prefix));
}

export function isPathAllowedByRules(
  urlPath: string,
  rules: RobotsRule[],
): boolean {
  const path = urlPath.startsWith("/") ? urlPath : `/${urlPath}`;
  const hit = matchingRules(path, rules);
  if (hit.length === 0) return true;
  const maxLen = Math.max(...hit.map((r) => r.prefix.length));
  const top = hit.filter((r) => r.prefix.length === maxLen);
  if (top.some((r) => r.kind === "allow")) return true;
  if (top.some((r) => r.kind === "disallow")) return false;
  return true;
}

export type RobotsCache = Map<string, ParsedRobotsDocument>;

export function createRobotsCache(): RobotsCache {
  return new Map();
}
