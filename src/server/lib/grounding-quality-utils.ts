import type { DbIntelligenceFact } from "../repositories/intelligence.repo";

export type VendorFactSelectionDropped = {
  excludedMarketingLow: number;
  excludedInferredLow: number;
  excludedUnknown: number;
  excludedMarketingMedium: number;
  excludedOperationalLow: number;
  excludedInferredMedium: number;
  excludedOther: number;
};

export type FactSelectionSummaryDetail = {
  includedStrongCount: number;
  includedFallbackCount: number;
  includedUnknownCount: number;
  droppedWeakCount: number;
  /** Withheld unknown-metadata facts (see droppedFactCounts.excludedUnknown). */
  droppedUnknownCount: number;
  bundleQuality: "strong" | "moderate" | "weak";
  /** Short operator-facing note when fallback or unknown facts matter. */
  bundleQualityNote?: string;
};

export type VendorFactSelectionResult = {
  selected: DbIntelligenceFact[];
  droppedFactCounts: VendorFactSelectionDropped;
  /** @deprecated Prefer factSelectionDetail + factSelectionSummaryText */
  weakFactIncludedCount: number;
  factSelectionSummaryText: string;
  factSelectionDetail: FactSelectionSummaryDetail;
};

function classify(f: DbIntelligenceFact): {
  cred: "operational" | "marketing" | "inferred" | "unknown";
  conf: "high" | "medium" | "low" | "unknown";
} {
  const cr = (f.credibility ?? "").trim().toLowerCase();
  const cf = (f.confidence ?? "").trim().toLowerCase();
  const cred =
    cr === "operational" || cr === "marketing" || cr === "inferred"
      ? cr
      : "unknown";
  const conf =
    cf === "high" || cf === "medium" || cf === "low" ? cf : "unknown";
  return { cred, conf };
}

/** Tier 1 = strongest; Tier 3 = unknown / weak marketing / inferred low (fallback only). */
function factTier(f: DbIntelligenceFact): 1 | 2 | 3 {
  const { cred, conf } = classify(f);
  const ft = f.factType;

  if (cred === "operational" && (conf === "high" || conf === "medium")) {
    return 1;
  }
  if (cred === "inferred" && conf === "medium") return 2;
  if (ft === "contact_block" && cred !== "marketing") return 2;
  if (
    cred === "operational" &&
    conf === "low" &&
    /address|phone|email|contact|hour|location/i.test(f.factText)
  ) {
    return 2;
  }
  return 3;
}

function isUnknownQuality(f: DbIntelligenceFact): boolean {
  const { cred, conf } = classify(f);
  return cred === "unknown" || conf === "unknown";
}

/**
 * Tiered vendor fact selection: unknown rows are Tier 3, never ranked like Tier 1.
 */
export function selectVendorFactsForGroundingBundle(
  facts: DbIntelligenceFact[],
  limit: number,
  strict: boolean,
): VendorFactSelectionResult {
  const dropped: VendorFactSelectionDropped = {
    excludedMarketingLow: 0,
    excludedInferredLow: 0,
    excludedUnknown: 0,
    excludedMarketingMedium: 0,
    excludedOperationalLow: 0,
    excludedInferredMedium: 0,
    excludedOther: 0,
  };

  const tier1 = facts.filter((f) => factTier(f) === 1);
  const tier2 = facts.filter((f) => factTier(f) === 2);
  const tier3 = facts.filter((f) => factTier(f) === 3);

  const sortRecent = (a: DbIntelligenceFact, b: DbIntelligenceFact) =>
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();

  tier1.sort(sortRecent);
  tier2.sort(sortRecent);
  tier3.sort(sortRecent);

  const strongOperational = tier1.filter((f) => {
    const { cred } = classify(f);
    return cred === "operational";
  }).length;

  const selected: DbIntelligenceFact[] = [];
  const seen = new Set<string>();

  const push = (f: DbIntelligenceFact) => {
    if (selected.length >= limit || seen.has(f.id)) return;
    seen.add(f.id);
    selected.push(f);
  };

  for (const f of tier1) push(f);

  for (const f of tier2) {
    if (selected.length >= limit) break;
    const { cred, conf } = classify(f);
    if (strict && cred === "operational" && conf === "low") {
      dropped.excludedOperationalLow++;
      continue;
    }
    if (
      strict &&
      cred === "inferred" &&
      conf === "medium" &&
      strongOperational >= 5
    ) {
      dropped.excludedInferredMedium++;
      continue;
    }
    push(f);
  }

  const tier1And2Count = selected.length;
  const allowTier3 = tier1And2Count < Math.min(6, limit);

  if (allowTier3 || tier1And2Count < 3) {
    for (const f of tier3) {
      if (selected.length >= limit) break;
      const { cred, conf } = classify(f);

      if (cred === "marketing" && conf === "low") {
        dropped.excludedMarketingLow++;
        continue;
      }
      if (cred === "inferred" && conf === "low") {
        if (tier1And2Count >= 4 && !strict) {
          dropped.excludedOther++;
          continue;
        }
      }

      if (strict && cred === "marketing" && conf === "medium") {
        dropped.excludedMarketingMedium++;
        continue;
      }
      if (
        !strict &&
        cred === "marketing" &&
        conf === "medium" &&
        strongOperational >= 4
      ) {
        dropped.excludedMarketingMedium++;
        continue;
      }

      if (isUnknownQuality(f)) {
        const unk = selected.filter(isUnknownQuality).length;
        if (unk >= 2 && tier1And2Count >= 3) {
          dropped.excludedUnknown++;
          continue;
        }
      }

      if (cred === "operational" && conf === "low") {
        if (strict || strongOperational >= 4) {
          dropped.excludedOperationalLow++;
          continue;
        }
      }

      push(f);
    }
  } else {
    for (const f of tier3) {
      const { cred, conf } = classify(f);
      if (cred === "marketing" && conf === "low") dropped.excludedMarketingLow++;
      else if (cred === "inferred" && conf === "low")
        dropped.excludedOther++;
      else if (isUnknownQuality(f)) dropped.excludedUnknown++;
      else dropped.excludedOther++;
    }
  }

  const includedStrongCount = selected.filter((f) => factTier(f) === 1).length;
  const includedUnknownCount = selected.filter(isUnknownQuality).length;
  const includedFallbackCount = selected.filter((f) => {
    if (factTier(f) === 1) return false;
    if (isUnknownQuality(f)) return false;
    return true;
  }).length;
  const droppedWeakCount = Object.values(dropped).reduce((a, b) => a + b, 0);

  let bundleQuality: FactSelectionSummaryDetail["bundleQuality"] = "moderate";
  if (includedUnknownCount > 0 || includedStrongCount < 2) {
    bundleQuality = "weak";
  } else if (
    includedStrongCount >= 4 &&
    includedUnknownCount === 0 &&
    includedFallbackCount === 0
  ) {
    bundleQuality = "strong";
  }

  const droppedUnknownCount = dropped.excludedUnknown;

  const bundleQualityNotes: string[] = [];
  if (includedUnknownCount > 0) {
    bundleQualityNotes.push(
      "Unknown-quality facts were included sparingly — treat them as provisional.",
    );
  }
  if (includedFallbackCount > 0 && bundleQuality !== "strong") {
    bundleQualityNotes.push(
      "This bundle includes fallback facts due to sparse stronger support.",
    );
  }

  const factSelectionDetail: FactSelectionSummaryDetail = {
    includedStrongCount,
    includedFallbackCount,
    includedUnknownCount,
    droppedWeakCount,
    droppedUnknownCount,
    bundleQuality,
    bundleQualityNote:
      bundleQualityNotes.length > 0 ? bundleQualityNotes.join(" ") : undefined,
  };

  const weakFactIncludedCount = selected.filter((f) => {
    if (isUnknownQuality(f)) return true;
    if (factTier(f) === 3) return true;
    const { cred } = classify(f);
    return cred === "marketing" || cred === "inferred";
  }).length;

  const factSelectionSummaryText = [
    `${selected.length} vendor facts · bundle ${bundleQuality}.`,
    includedUnknownCount > 0
      ? `${includedUnknownCount} unknown-metadata fact(s) included only as fallback.`
      : null,
    includedFallbackCount > 0
      ? `${includedFallbackCount} non-strong fact(s) included (fallback tier).`
      : null,
    droppedWeakCount > 0
      ? `${droppedWeakCount} low-signal fact(s) withheld.`
      : null,
  ]
    .filter(Boolean)
    .join(" ");

  return {
    selected,
    droppedFactCounts: dropped,
    weakFactIncludedCount,
    factSelectionSummaryText,
    factSelectionDetail,
  };
}
