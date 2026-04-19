import {
  listVendorFitDimensionsByVendor,
  upsertVendorFitDimension,
} from "../repositories/vendor-intelligence.repo";
import {
  getVendorInterviewAssessmentByQuestion,
  listVendorInterviewQuestionsFull,
  type DbVendorInterviewQuestionFull,
} from "../repositories/vendor-interview.repo";

function categoryToFitDimensions(
  q: DbVendorInterviewQuestionFull,
): string[] {
  if (q.linkedFitDimensionKeys.length > 0) return q.linkedFitDimensionKeys;
  const c = q.category.toLowerCase();
  if (c === "capability") return ["technical_capability"];
  if (c === "integration") return ["integration_fit"];
  if (c === "execution") return ["delivery_operations"];
  if (c === "pricing") return ["risk_posture"];
  if (c === "risk") return ["risk_posture"];
  if (c === "differentiation") return ["technical_capability", "references_proof"];
  if (c === "stack_role") return ["integration_fit", "delivery_operations"];
  if (c === "proof") return ["references_proof", "technical_capability"];
  if (c === "truth_test") return ["references_proof", "risk_posture"];
  return ["technical_capability"];
}

function clampScore(n: number): number {
  return Math.max(1, Math.min(5, Math.round(n)));
}

function bumpConfidence(c: string): string {
  const x = c.toLowerCase();
  if (x === "low") return "medium";
  if (x === "medium") return "high";
  return c;
}

/**
 * Nudges persisted fit dimensions using assessed interview answers (vendor assertions, not verified proof).
 */
export async function mergeInterviewEvidenceIntoFitDimensions(
  vendorId: string,
): Promise<void> {
  const dims = await listVendorFitDimensionsByVendor(vendorId);
  if (dims.length === 0) return;

  const questions = await listVendorInterviewQuestionsFull(vendorId);
  const deltaByDim: Record<string, number> = {};
  let highQualityN = 0;

  for (const q of questions) {
    const a = await getVendorInterviewAssessmentByQuestion(q.id);
    if (!a || a.score0To5 < 0) continue;
    if (a.score0To5 >= 4) highQualityN += 1;
    const dimsT = categoryToFitDimensions(q);
    const w = 1 / Math.max(1, dimsT.length);
    const contrib = ((a.score0To5 - 2.5) / 2.5) * 0.18 * w;
    for (const dk of dimsT) {
      deltaByDim[dk] = (deltaByDim[dk] ?? 0) + contrib;
    }
  }

  if (Object.keys(deltaByDim).length === 0) return;

  const byKey = Object.fromEntries(dims.map((d) => [d.dimensionKey, d]));
  for (const dk of Object.keys(deltaByDim)) {
    const row = byKey[dk];
    if (!row) continue;
    const delta = deltaByDim[dk] ?? 0;
    if (Math.abs(delta) < 0.03) continue;
    const next = clampScore(row.score + delta);
    const rationale = row.rationale.includes("[Interview evidence]")
      ? row.rationale
      : `${row.rationale}\n[Interview evidence] Adjusted from structured interview assessments (vendor-supplied; not third-party verified).`;
    let confidence = row.confidence;
    if (highQualityN >= 3 && dk === "references_proof") {
      confidence = bumpConfidence(confidence);
    }
    await upsertVendorFitDimension({
      vendorId,
      dimensionKey: dk,
      score: next,
      confidence,
      rationale,
      sourceIds: row.sourceIds,
    });
  }
}
