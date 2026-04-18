import type { DbIntelligenceFact } from "../repositories/intelligence.repo";

const MARKETING_HINT =
  /\b(leading|trusted|premier|world[- ]class|best[- ]in[- ]class|high quality|innovative|#1|top rated)\b/i;

const MAX_SKIPPED_EXAMPLES = 10;

function norm(s: string): string {
  return s.trim().toLowerCase();
}

function previewText(text: string, max = 120): string {
  const t = text.replace(/\s+/g, " ").trim();
  if (t.length <= max) return t;
  return `${t.slice(0, max - 1)}…`;
}

/**
 * Conservative inference (same rules as legacy fill-missing backfill).
 */
export function inferLegacyCredibilityForFact(f: DbIntelligenceFact): {
  credibility: string;
  confidence: string;
} {
  const cls = (f.classification ?? "").toLowerCase();
  if (cls.includes("verified")) {
    return { credibility: "operational", confidence: "medium" };
  }

  const t = f.factType;
  const text = f.factText.slice(0, 2000);

  if (t === "ai_tag" || t === "page_summary") {
    return { credibility: "inferred", confidence: "medium" };
  }
  if (t === "capability" || t === "technology_reference") {
    return { credibility: "operational", confidence: "medium" };
  }
  if (t === "contact_block") {
    return { credibility: "operational", confidence: "high" };
  }
  if (t === "allcare_fact") {
    if (MARKETING_HINT.test(text)) {
      return { credibility: "marketing", confidence: "low" };
    }
    if (
      /\d|%|24\s*\/\s*7|hour|daily|weekly|delivery|integrat|system|platform|compliant/i.test(
        text,
      )
    ) {
      return { credibility: "operational", confidence: "medium" };
    }
    return { credibility: "operational", confidence: "medium" };
  }
  if (MARKETING_HINT.test(text)) {
    return { credibility: "marketing", confidence: "medium" };
  }
  return { credibility: "inferred", confidence: "low" };
}

/**
 * Strong, rule-based fixes only — skips ambiguous reclassifications.
 */
export function findSafeInconsistencyCorrection(f: DbIntelligenceFact): {
  credibility: string;
  confidence: string;
  reason: string;
} | null {
  const cr = norm(f.credibility);
  const cf = norm(f.confidence);
  if (!cr || !cf) return null;

  if (f.factType === "contact_block" && cr === "marketing") {
    return {
      credibility: "operational",
      confidence: "high",
      reason: "contact_block must not be classified as marketing",
    };
  }

  if (f.factType === "ai_tag" && cr === "operational" && cf === "high") {
    return {
      credibility: "inferred",
      confidence: "medium",
      reason: "ai_tag should not be operational/high",
    };
  }

  if (f.factType === "page_summary" && cr === "operational" && cf === "high") {
    return {
      credibility: "inferred",
      confidence: "medium",
      reason: "page_summary should not be operational/high",
    };
  }

  if (
    MARKETING_HINT.test(f.factText) &&
    cr === "operational" &&
    (cf === "high" || cf === "medium")
  ) {
    return {
      credibility: "marketing",
      confidence: "low",
      reason: "boastful language inconsistent with operational credibility",
    };
  }

  return null;
}

/**
 * Moderate tier: likely mismatches that are still opt-in to auto-fix.
 * Never as aggressive as broad ML rewrites.
 */
export function findModerateInconsistencyCorrection(f: DbIntelligenceFact): {
  credibility: string;
  confidence: string;
  reason: string;
} | null {
  if (findSafeInconsistencyCorrection(f)) return null;

  const cr = norm(f.credibility);
  const cf = norm(f.confidence);
  if (!cr || !cf) return null;

  const text = f.factText;
  if (
    (f.factType === "capability" || f.factType === "technology_reference") &&
    cr === "marketing"
  ) {
    if (
      /\d|delivery|24\s*\/\s*7|dispens|pharmacist|licensed|state|route|integrat|platform|system/i.test(
        text,
      )
    ) {
      return {
        credibility: "operational",
        confidence: "medium",
        reason: "capability-like content was marked marketing",
      };
    }
  }

  if (
    (f.factType === "allcare_fact" || f.factType === "capability") &&
    cr === "operational" &&
    cf === "high" &&
    MARKETING_HINT.test(text) &&
    !/\d{3,}/.test(text)
  ) {
    return {
      credibility: "marketing",
      confidence: "low",
      reason: "promotional tone unlikely to warrant operational/high",
    };
  }

  return null;
}

export type SkippedAmbiguousExample = {
  factId: string;
  factType: string;
  factTextPreview: string;
  currentCredibility: string;
  currentConfidence: string;
  suggestedCredibility: string;
  suggestedConfidence: string;
  reasonSkipped: string;
};

export type LegacyFactAuditClassification = {
  missing: DbIntelligenceFact[];
  safeCorrections: Array<{
    fact: DbIntelligenceFact;
    credibility: string;
    confidence: string;
    reason: string;
  }>;
  moderateCorrections: Array<{
    fact: DbIntelligenceFact;
    credibility: string;
    confidence: string;
    reason: string;
  }>;
  skippedAmbiguous: number;
  skippedAmbiguousExamples: SkippedAmbiguousExample[];
};

export function classifyFactsForLegacyAudit(
  facts: DbIntelligenceFact[],
): LegacyFactAuditClassification {
  const missing: DbIntelligenceFact[] = [];
  const safeCorrections: LegacyFactAuditClassification["safeCorrections"] = [];
  const moderateCorrections: LegacyFactAuditClassification["moderateCorrections"] =
    [];
  let skippedAmbiguous = 0;
  const skippedAmbiguousExamples: SkippedAmbiguousExample[] = [];

  for (const f of facts) {
    const cr = (f.credibility ?? "").trim();
    const cf = (f.confidence ?? "").trim();
    if (!cr || !cf) {
      missing.push(f);
      continue;
    }
    const safe = findSafeInconsistencyCorrection(f);
    if (safe) {
      safeCorrections.push({ fact: f, ...safe });
      continue;
    }
    const mod = findModerateInconsistencyCorrection(f);
    if (mod) {
      moderateCorrections.push({ fact: f, ...mod });
      continue;
    }
    const expected = inferLegacyCredibilityForFact(f);
    if (norm(cr) !== expected.credibility || norm(cf) !== expected.confidence) {
      skippedAmbiguous++;
      if (skippedAmbiguousExamples.length < MAX_SKIPPED_EXAMPLES) {
        skippedAmbiguousExamples.push({
          factId: f.id,
          factType: f.factType,
          factTextPreview: previewText(f.factText),
          currentCredibility: cr,
          currentConfidence: cf,
          suggestedCredibility: expected.credibility,
          suggestedConfidence: expected.confidence,
          reasonSkipped:
            "Differs from rule-based inference but does not meet safe or moderate auto-correct thresholds.",
        });
      }
    }
  }

  return {
    missing,
    safeCorrections,
    moderateCorrections,
    skippedAmbiguous,
    skippedAmbiguousExamples,
  };
}
