import type { AllCareCrawlStats } from "../services/allcare-scrape.service";
import type { VendorResolution } from "../repositories/vendor.repo";

export type IngestQualityBand = "strong" | "moderate" | "weak";

export type IngestQualityConfidence = "high" | "medium" | "low";

export type IngestQualityBreakdown = {
  coverage: number;
  parsing: number;
  factConfidence: number;
  /** Share of operational / high-signal facts vs marketing noise (0–100). */
  operationalSignal: number;
  vendorMatch: number;
  brandingConfidence: number;
};

export type IngestQualityResult = {
  qualityScore: number;
  qualityBand: IngestQualityBand;
  /** How much to trust the numeric score under current data conditions. */
  confidence: IngestQualityConfidence;
  breakdown: IngestQualityBreakdown;
  penalties: string[];
  /** User-facing caveats (subset overlaps penalties; tuned for honesty). */
  warnings: string[];
};

const SPARSE_PAGE_THRESHOLD = 4;
const SPARSE_FETCH_THRESHOLD = 4;

function vendorSubscore(res: VendorResolution): number {
  if (res.matchType === "ambiguous") return 22;
  if (res.confidence === "none" || res.matchType === "none") return 18;
  if (res.matchType === "linked" || res.matchType === "exact") {
    return res.confidence === "high" ? 96 : 72;
  }
  if (res.matchType === "fuzzy") {
    if (res.confidence === "medium") return 62;
    if (res.confidence === "low") return 38;
  }
  return 28;
}

function logoSubscore(conf: string | null | undefined): number {
  if (conf === "high") return 88;
  if (conf === "medium") return 64;
  if (conf === "low") return 48;
  return 50;
}

function bandFromScore(score: number): IngestQualityBand {
  if (score >= 72) return "strong";
  if (score >= 46) return "moderate";
  return "weak";
}

function uniqWarn(items: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const w of items) {
    const k = w.trim();
    if (!k || seen.has(k)) continue;
    seen.add(k);
    out.push(k);
  }
  return out;
}

function deriveResultConfidence(input: {
  band: IngestQualityBand;
  warnings: string[];
  sparseData: boolean;
  vendorUnresolved: boolean;
  parseStress: boolean;
}): IngestQualityConfidence {
  if (input.band === "weak" || input.warnings.length >= 4) return "low";
  if (
    input.sparseData ||
    input.vendorUnresolved ||
    input.parseStress ||
    input.band === "moderate"
  ) {
    return "medium";
  }
  if (input.warnings.length > 0) return "medium";
  return "high";
}

export function computeAllCareIngestQuality(input: {
  crawlStats: AllCareCrawlStats;
  pagesStored: number;
  parseErrorCount: number;
  factAgg: {
    total: number;
    operationalHigh: number;
    operationalMedium: number;
    marketing: number;
    inferred: number;
    missingCredibilityOrConfidence: number;
  };
  vendorResolution: VendorResolution;
  logoConfidence: string | null;
}): IngestQualityResult {
  const penalties: string[] = [];
  const warnings: string[] = [];

  const discovered = Math.max(input.crawlStats.pagesDiscovered, 1);
  const fromCache = input.crawlStats.pagesLoadedFromStore > 0;
  const fetchRatio =
    fromCache || discovered === 0
      ? 1
      : input.crawlStats.pagesFetched / discovered;

  let coverage = fromCache
    ? Math.min(82, 70 + Math.min(12, input.pagesStored))
    : Math.min(100, Math.round(fetchRatio * 92));

  if (!fromCache && fetchRatio < 0.45) {
    penalties.push("Sparse crawl coverage reduced score");
    coverage = Math.min(coverage, 48);
  }

  const stored = Math.max(input.pagesStored, 1);
  const parsedOk = Math.max(0, stored - input.parseErrorCount);
  let parsing = Math.min(100, Math.round((parsedOk / stored) * 94));
  if (input.parseErrorCount > 0) {
    const errShare = input.parseErrorCount / stored;
    if (errShare > 0.35) {
      parsing = Math.min(parsing, 52);
      penalties.push("Several pages failed AI parse");
      warnings.push("Several pages failed AI parse — coverage may be incomplete");
    } else if (errShare > 0.15) {
      parsing = Math.min(parsing, 68);
      warnings.push("Some pages failed AI parse — treat coverage as partial");
    }
  }

  const ft = Math.max(input.factAgg.total, 1);
  const missingRatio =
    input.factAgg.missingCredibilityOrConfidence / ft;
  if (missingRatio > 0.32) {
    penalties.push("Many facts missing credibility or confidence metadata");
    warnings.push("Many intelligence facts still lack credibility metadata");
  } else if (missingRatio > 0.18) {
    penalties.push("Some facts missing credibility or confidence metadata");
    warnings.push("Some facts lack credibility metadata");
  }

  const factConfidence = Math.min(
    88,
    Math.round(
      (input.factAgg.operationalHigh * 100 +
        input.factAgg.operationalMedium * 68 +
        Math.max(0, ft - input.factAgg.operationalHigh - input.factAgg.operationalMedium) *
          28) /
        ft -
        missingRatio * 42,
    ),
  );

  const marketingRatio = input.factAgg.marketing / ft;
  const operationalCore =
    (input.factAgg.operationalHigh + input.factAgg.operationalMedium) / ft;
  let operationalSignal = Math.min(
    100,
    Math.round(operationalCore * 100 - marketingRatio * 55),
  );
  if (marketingRatio > 0.35 && input.factAgg.marketing >= 3) {
    penalties.push("High ratio of marketing-only claims");
    operationalSignal = Math.min(operationalSignal, 42);
  }

  const vendorMatch = vendorSubscore(input.vendorResolution);
  const vendorUnresolved =
    input.vendorResolution.matchType === "ambiguous" ||
    input.vendorResolution.confidence === "none" ||
    input.vendorResolution.matchType === "none";
  if (vendorUnresolved) {
    penalties.push("Vendor match ambiguous or unresolved");
    warnings.push("Vendor resolution remains ambiguous or unresolved");
  }

  const brandingConfidence = logoSubscore(input.logoConfidence);
  if (input.logoConfidence === "low") {
    penalties.push("Logo confidence low (light penalty)");
  }

  let qualityScore = Math.round(
    coverage * 0.19 +
      parsing * 0.19 +
      factConfidence * 0.2 +
      operationalSignal * 0.14 +
      vendorMatch * 0.17 +
      brandingConfidence * 0.11,
  );

  const lowVolume = input.pagesStored < 2 || (input.factAgg.total < 6 && input.pagesStored < 4);
  if (lowVolume) {
    penalties.push("Low page or fact volume — score capped conservatively");
    qualityScore = Math.min(qualityScore, 44);
  }

  const sparsePages = input.pagesStored < SPARSE_PAGE_THRESHOLD;
  const sparseFetch =
    !fromCache &&
    input.crawlStats.pagesFetched < SPARSE_FETCH_THRESHOLD &&
    input.crawlStats.pagesDiscovered > input.crawlStats.pagesFetched;
  const sparseData = sparsePages || sparseFetch || (!fromCache && fetchRatio < 0.55);

  if (sparseData) {
    warnings.push("Sparse crawl coverage limits confidence");
    qualityScore = Math.min(qualityScore, 66);
  }

  if (
    input.factAgg.total >= 4 &&
    input.factAgg.operationalHigh + input.factAgg.operationalMedium <
      Math.min(3, Math.max(1, Math.ceil(input.factAgg.total / 5)))
  ) {
    warnings.push("Thin operational signal — grounding may rely on lower-trust facts");
    qualityScore = Math.min(qualityScore, qualityScore >= 60 ? qualityScore - 6 : qualityScore);
  }

  if (vendorUnresolved) {
    qualityScore = Math.min(qualityScore, 58);
  }

  qualityScore = Math.min(100, Math.max(0, qualityScore));

  let qualityBand = bandFromScore(qualityScore);

  if (sparseData && qualityBand === "strong") {
    qualityScore = Math.min(qualityScore, 71);
    qualityBand = bandFromScore(qualityScore);
  }
  if (vendorUnresolved && qualityBand === "strong") {
    qualityScore = Math.min(qualityScore, 65);
    qualityBand = bandFromScore(qualityScore);
  }

  const parseStress = input.parseErrorCount > 0 && input.parseErrorCount / stored >= 0.2;

  const confidence = deriveResultConfidence({
    band: qualityBand,
    warnings: uniqWarn(warnings),
    sparseData,
    vendorUnresolved,
    parseStress,
  });

  return {
    qualityScore,
    qualityBand,
    confidence,
    breakdown: {
      coverage,
      parsing,
      factConfidence,
      operationalSignal,
      vendorMatch,
      brandingConfidence,
    },
    penalties,
    warnings: uniqWarn(warnings),
  };
}
