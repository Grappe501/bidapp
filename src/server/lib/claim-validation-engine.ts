import type { ClaimCategory } from "./claim-normalization";
import {
  CONTRADICTION_HINTS,
  isCriticalClaimKey,
  matchTaxonomyClaim,
  normalizeToClaimKey,
} from "./claim-normalization";

export type SupportLevel = "none" | "weak" | "moderate" | "strong";
export type ContradictionStatus = "none" | "possible" | "clear";
export type ConfidenceLevel = "high" | "medium" | "low";
export type ScoringImpact = "positive" | "neutral" | "negative" | "watch";

export function factWeight(input: {
  credibility: string;
  confidence: string;
  factType?: string;
}): number {
  const cred = input.credibility.toLowerCase();
  const conf = input.confidence.toLowerCase();
  let w = 1;
  if (cred === "operational") w += 1.5;
  else if (cred === "marketing") w -= 0.4;
  else if (cred === "inferred") w -= 0.3;
  if (conf === "high") w += 1;
  else if (conf === "medium") w += 0.5;
  else if (conf === "low") w -= 0.2;
  if (/case|reference|implementation|pilot/i.test(input.factType ?? "")) w += 0.4;
  return Math.max(0.2, w);
}

export function claimRowWeight(input: {
  credibility: string;
  confidence: string;
}): number {
  const cred = input.credibility.toLowerCase();
  const conf = input.confidence.toLowerCase();
  let w = 0.8;
  if (cred === "operational") w += 1.2;
  if (cred === "marketing") w -= 0.35;
  if (conf === "high") w += 0.6;
  if (conf === "medium") w += 0.3;
  if (conf === "low") w -= 0.4;
  return Math.max(0.15, w);
}

export function computeSupportAndContradiction(input: {
  supportScore: number;
  contradictScore: number;
  claimCount: number;
}): {
  supportLevel: SupportLevel;
  contradictionStatus: ContradictionStatus;
  confidence: ConfidenceLevel;
  scoringImpact: ScoringImpact;
  needsFollowUp: boolean;
  followUpReason: string | null;
} {
  const { supportScore, contradictScore, claimCount } = input;

  let contradictionStatus: ContradictionStatus = "none";
  if (contradictScore >= 3 && supportScore < 2) contradictionStatus = "clear";
  else if (contradictScore >= 1.2 && supportScore < 4) contradictionStatus = "possible";
  else if (contradictScore >= 2.5) contradictionStatus = "possible";

  let supportLevel: SupportLevel = "none";
  if (supportScore >= 6 && contradictScore < 1.5) supportLevel = "strong";
  else if (supportScore >= 3.5 && contradictScore < 2.5) supportLevel = "moderate";
  else if (supportScore >= 1.2 || claimCount > 0) supportLevel = "weak";
  else supportLevel = "none";

  if (contradictionStatus === "clear") supportLevel = "none";
  else if (contradictionStatus === "possible" && supportLevel === "strong")
    supportLevel = "moderate";

  let confidence: ConfidenceLevel = "low";
  if (supportLevel === "strong" && contradictionStatus === "none") confidence = "high";
  else if (supportLevel === "moderate" || (supportLevel === "weak" && supportScore >= 2))
    confidence = "medium";

  let scoringImpact: ScoringImpact = "neutral";
  if (supportLevel === "strong" && contradictionStatus === "none") scoringImpact = "positive";
  else if (contradictionStatus === "clear") scoringImpact = "negative";
  else if (contradictionStatus === "possible" || supportLevel === "weak")
    scoringImpact = "watch";
  else if (supportLevel === "none") scoringImpact = "negative";

  const needsFollowUp =
    supportLevel === "weak" ||
    supportLevel === "none" ||
    contradictionStatus !== "none";
  const followUpReason = needsFollowUp
    ? `Support ${supportLevel}; contradiction ${contradictionStatus} — verify with customer references or written interface details.`
    : null;

  return {
    supportLevel,
    contradictionStatus,
    confidence,
    scoringImpact,
    needsFollowUp,
    followUpReason,
  };
}

export function buildMachineRationale(input: {
  key: string;
  category: ClaimCategory;
  supportPoints: number;
  contradictPoints: number;
  supportingFactIds: string[];
  contradictingFactIds: string[];
  claimSourceSummary: string;
}): string {
  return [
    `Claim key ${input.key} (${input.category}).`,
    `Evidence support score ≈ ${input.supportPoints.toFixed(1)}; contradiction signals ≈ ${input.contradictPoints.toFixed(1)}.`,
    `${input.supportingFactIds.length} fact(s) support; ${input.contradictingFactIds.length} fact(s) conflict.`,
    `Sources: ${input.claimSourceSummary}.`,
  ].join(" ");
}

/** Map normalized claim keys to fit dimension keys for scoring nudges. */
export function claimKeyToFitDimensions(key: string, category: ClaimCategory): string[] {
  const k = key.toLowerCase();
  const out = new Set<string>();
  if (category === "integration" || k.startsWith("integration."))
    out.add("integration_fit");
  if (
    category === "delivery" ||
    k.startsWith("delivery.") ||
    category === "clinical"
  )
    out.add("delivery_operations");
  if (
    category === "compliance" ||
    category === "security" ||
    k.startsWith("compliance.") ||
    k.startsWith("security.")
  )
    out.add("risk_posture");
  if (
    category === "implementation" ||
    category === "support" ||
    k.startsWith("implementation.") ||
    k.startsWith("support.")
  ) {
    out.add("delivery_operations");
    out.add("technical_capability");
  }
  if (category === "experience" || category === "differentiation")
    out.add("references_proof");
  if (category === "billing" || category === "pricing") {
    out.add("technical_capability");
    out.add("risk_posture");
  }
  if (category === "packaging") out.add("technical_capability");
  if (out.size === 0) out.add("technical_capability");
  return [...out];
}

export function isContradictingFactText(text: string): boolean {
  return CONTRADICTION_HINTS.some((r) => r.test(text));
}

export { isCriticalClaimKey, matchTaxonomyClaim, normalizeToClaimKey };
