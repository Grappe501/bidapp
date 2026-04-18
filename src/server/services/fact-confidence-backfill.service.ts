import {
  assertIntelligenceFactsCredibilityColumns,
  listFactsByCompanyProfile,
  patchIntelligenceFactCredibility,
  setIntelligenceFactCredibility,
} from "../repositories/intelligence.repo";
import {
  classifyFactsForLegacyAudit,
  inferLegacyCredibilityForFact,
  type SkippedAmbiguousExample,
} from "../lib/legacy-fact-audit-utils";

export type LegacyFactBackfillMode =
  | "fill-missing"
  | "audit-only"
  | "safe-correct"
  | "moderate-correct";

export type LegacyFactAuditSummary = {
  examined: number;
  filledMissing: number;
  /** Total corrections applied (safe + moderate). */
  correctedValues: number;
  correctedSafeCount: number;
  correctedModerateCount: number;
  skippedAmbiguous: number;
  skippedAmbiguousExamples?: SkippedAmbiguousExample[];
  mode: LegacyFactBackfillMode;
  at: string;
  wouldFillMissing?: number;
  /** @deprecated Use wouldCorrectSafe */
  wouldCorrect?: number;
  wouldCorrectSafe?: number;
  wouldCorrectModerate?: number;
};

const MAX_EXAMPLES_PERSIST = 10;

function trimExamplesForPersist(
  examples: SkippedAmbiguousExample[] | undefined,
): SkippedAmbiguousExample[] | undefined {
  if (!examples?.length) return examples;
  return examples.slice(0, MAX_EXAMPLES_PERSIST);
}

export function trimLegacyFactAuditForBrandingMeta(
  summary: LegacyFactAuditSummary,
): LegacyFactAuditSummary {
  return {
    ...summary,
    skippedAmbiguousExamples: trimExamplesForPersist(
      summary.skippedAmbiguousExamples,
    ),
  };
}

/**
 * Runs legacy intelligence_fact metadata maintenance for one company profile.
 *
 * - fill-missing: only empty credibility/confidence.
 * - audit-only: no writes; returns counts and skipped examples.
 * - safe-correct: fill-missing + high-confidence inconsistency fixes.
 * - moderate-correct: safe-correct + additional likely (but not absolute) fixes (opt-in).
 */
export async function runLegacyFactMetadataPass(
  companyProfileId: string,
  mode: LegacyFactBackfillMode,
): Promise<LegacyFactAuditSummary> {
  await assertIntelligenceFactsCredibilityColumns();
  const facts = await listFactsByCompanyProfile(companyProfileId);
  const at = new Date().toISOString();
  const {
    missing,
    safeCorrections,
    moderateCorrections,
    skippedAmbiguous,
    skippedAmbiguousExamples,
  } = classifyFactsForLegacyAudit(facts);

  if (mode === "audit-only") {
    return {
      examined: facts.length,
      filledMissing: 0,
      correctedValues: 0,
      correctedSafeCount: 0,
      correctedModerateCount: 0,
      skippedAmbiguous,
      skippedAmbiguousExamples: [...skippedAmbiguousExamples],
      mode,
      at,
      wouldFillMissing: missing.length,
      wouldCorrect: safeCorrections.length,
      wouldCorrectSafe: safeCorrections.length,
      wouldCorrectModerate: moderateCorrections.length,
    };
  }

  let filledMissing = 0;
  let correctedSafeCount = 0;
  let correctedModerateCount = 0;

  for (const f of missing) {
    const { credibility, confidence } = inferLegacyCredibilityForFact(f);
    await patchIntelligenceFactCredibility({
      id: f.id,
      credibility,
      confidence,
    });
    filledMissing++;
  }

  if (mode === "safe-correct" || mode === "moderate-correct") {
    for (const sc of safeCorrections) {
      await setIntelligenceFactCredibility({
        id: sc.fact.id,
        credibility: sc.credibility,
        confidence: sc.confidence,
      });
      correctedSafeCount++;
    }
  }

  if (mode === "moderate-correct") {
    for (const mc of moderateCorrections) {
      await setIntelligenceFactCredibility({
        id: mc.fact.id,
        credibility: mc.credibility,
        confidence: mc.confidence,
      });
      correctedModerateCount++;
    }
  }

  const correctedValues = correctedSafeCount + correctedModerateCount;

  return {
    examined: facts.length,
    filledMissing,
    correctedValues,
    correctedSafeCount,
    correctedModerateCount,
    skippedAmbiguous,
    skippedAmbiguousExamples: [...skippedAmbiguousExamples],
    mode,
    at,
  };
}

/** @deprecated Prefer runLegacyFactMetadataPass(…, "fill-missing"). */
export async function backfillLegacyFactCredibilityForCompanyProfile(
  companyProfileId: string,
): Promise<{ examined: number; updated: number }> {
  const r = await runLegacyFactMetadataPass(companyProfileId, "fill-missing");
  return { examined: r.examined, updated: r.filledMissing };
}

export async function auditLegacyFactQuality(
  companyProfileId: string,
): Promise<LegacyFactAuditSummary> {
  return runLegacyFactMetadataPass(companyProfileId, "audit-only");
}

export async function correctLegacyFactQuality(
  companyProfileId: string,
  mode: "fill-missing" | "safe-correct" | "moderate-correct",
): Promise<LegacyFactAuditSummary> {
  return runLegacyFactMetadataPass(companyProfileId, mode);
}
