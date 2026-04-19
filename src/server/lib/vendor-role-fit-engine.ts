import type { DbVendorClaimValidation } from "../repositories/vendor-claim-validation.repo";
import { effectiveSupportLevelFromRow } from "../services/vendor-claim-validation-merge.service";
import {
  CRITICAL_ROLE_KEYS,
  type RoleFitBand,
  type RoleOwnershipBand,
  type RoleRiskBand,
  type RoleStrategyAssessment,
  type VendorRoleDefinition,
  VENDOR_ROLE_TAXONOMY_V1,
} from "./vendor-role-taxonomy";

export type RoleFitSimulationContext = {
  corpusLower: string;
  fitByKey: Record<string, { score: number; confidence: string }>;
  integrationRows: Array<{ requirementKey: string; status: string }>;
  claimValidations: DbVendorClaimValidation[];
  interviewUnresolvedP1: number;
  operationalFactCount: number;
  marketingClaimRatio: number;
  vendorStrengths: string[];
  vendorWeaknesses: string[];
};

export type EvaluatedVendorRole = {
  roleKey: string;
  roleLabel: string;
  ownershipRecommendation: RoleOwnershipBand;
  confidence: "high" | "medium" | "low";
  fitLevel: RoleFitBand;
  evidenceStrength: "strong" | "moderate" | "weak" | "none";
  maloneDependencyLevel: RoleRiskBand;
  handoffComplexity: RoleRiskBand;
  overlapRisk: RoleRiskBand;
  gapRisk: RoleRiskBand;
  rationale: string;
  requiredMaloneResponsibilities: string[];
  vendorStrengthSignals: string[];
  vendorWeaknessSignals: string[];
  unresolvedQuestions: string[];
};

function avgFitScore(
  def: VendorRoleDefinition,
  fitByKey: RoleFitSimulationContext["fitByKey"],
): number | null {
  const keys = def.relatedFitDimensions;
  let s = 0;
  let n = 0;
  for (const k of keys) {
    const row = fitByKey[k];
    if (row) {
      s += row.score;
      n++;
    }
  }
  return n > 0 ? s / n : null;
}

function fitLevelFromScore(avg: number | null): RoleFitBand {
  if (avg == null) return "unknown";
  if (avg >= 4) return "strong";
  if (avg >= 3) return "adequate";
  if (avg >= 2) return "weak";
  return "weak";
}

function claimSupportForRole(
  def: VendorRoleDefinition,
  claimValidations: DbVendorClaimValidation[],
): "none" | "weak" | "moderate" | "strong" {
  const keys = def.relatedClaimKeys ?? [];
  if (keys.length === 0) return "none";
  let bestRank = 0;
  let best: "none" | "weak" | "moderate" | "strong" = "none";
  for (const k of keys) {
    const row = claimValidations.find((v) => v.normalizedClaimKey === k);
    if (!row) continue;
    const eff = effectiveSupportLevelFromRow(row) as
      | "none"
      | "weak"
      | "moderate"
      | "strong";
    const rank =
      eff === "strong" ? 3 : eff === "moderate" ? 2 : eff === "weak" ? 1 : 0;
    if (rank > bestRank) {
      bestRank = rank;
      best = eff;
    }
  }
  return best;
}

function integrationStressForRole(def: VendorRoleDefinition, ctx: RoleFitSimulationContext): number {
  if (!def.key.startsWith("integration.")) return 0;
  return ctx.integrationRows.filter((r) => r.status === "unknown" || r.status === "gap")
    .length;
}

function inferEvidenceStrength(
  ctx: RoleFitSimulationContext,
  claimSup: "none" | "weak" | "moderate" | "strong",
): "strong" | "moderate" | "weak" | "none" {
  if (claimSup === "strong") return "strong";
  if (claimSup === "moderate") return "moderate";
  if (ctx.operationalFactCount >= 8 && claimSup !== "none") return "moderate";
  if (claimSup === "weak") return "weak";
  if (ctx.marketingClaimRatio > 0.5) return "weak";
  return "none";
}

export function evaluateVendorRole(
  def: VendorRoleDefinition,
  ctx: RoleFitSimulationContext,
): EvaluatedVendorRole {
  const avg = avgFitScore(def, ctx.fitByKey);
  let fitLevel = fitLevelFromScore(avg);
  const claimSup = claimSupportForRole(def, ctx.claimValidations);
  const ev = inferEvidenceStrength(ctx, claimSup);

  if (ev === "none" && fitLevel !== "weak") fitLevel = "unknown";

  const strengths: string[] = [];
  const weaknesses: string[] = [];
  const maloneResp: string[] = [];
  const unknowns: string[] = [];

  for (const rx of def.corpusHintsOwn ?? []) {
    if (rx.test(ctx.corpusLower)) strengths.push(`Corpus matches capability hint for ${def.label}.`);
  }
  for (const rx of def.corpusHintsAvoid ?? []) {
    if (rx.test(ctx.corpusLower)) weaknesses.push(`Corpus contains risk-pattern language for ${def.label}.`);
  }
  for (const w of ctx.vendorWeaknesses) {
    const wl = w.toLowerCase();
    if (wl.length > 5 && def.label.toLowerCase().split(/\s+/).some((p) => p.length > 3 && wl.includes(p)))
      weaknesses.push(`Vendor weakness line: ${w.slice(0, 120)}`);
  }
  for (const s of ctx.vendorStrengths) {
    const sl = s.toLowerCase();
    if (sl.length > 5 && def.relatedFitDimensions.some((d) => sl.includes(d.replace(/_/g, " "))))
      strengths.push(`Strength: ${s.slice(0, 120)}`);
  }

  const unkInt = integrationStressForRole(def, ctx);
  if (unkInt >= 2 && def.key.startsWith("integration.")) {
    unknowns.push(`${unkInt} integration rows unknown/gap — ownership boundary unclear.`);
  }

  let ownership: RoleOwnershipBand = "unknown";
  const scoreOk = avg != null && avg >= 3.5;
  const scoreWeak = avg != null && avg < 2.5;

  if (fitLevel === "strong" && (ev === "strong" || ev === "moderate") && claimSup !== "weak") {
    ownership = "own";
  } else if (scoreOk && ev !== "none") {
    ownership = claimSup === "strong" || claimSup === "moderate" ? "share" : "share";
  } else if (fitLevel === "adequate" && ev === "moderate") {
    ownership = "share";
  } else if (fitLevel === "weak" || scoreWeak) {
    ownership = ev === "none" ? "unknown" : "support";
  }

  if (def.key.startsWith("integration.") && (claimSup === "none" || claimSup === "weak") && unkInt >= 1) {
    ownership = "avoid";
    weaknesses.push("Integration claim support is weak or absent while MatrixCare/EHR gaps remain — Malone may carry build burden.");
  }

  if (def.key.startsWith("billing.") && claimSup === "none" && ctx.interviewUnresolvedP1 >= 2) {
    if (ownership === "own") ownership = "share";
    unknowns.push("Billing ownership uncertain — P1 interview gaps remain.");
  }

  if (ownership === "unknown" && scoreOk) ownership = "share";

  let maloneDependency: RoleRiskBand = "low";
  if (ownership === "avoid" || (ownership === "support" && def.criticalForBid)) maloneDependency = "high";
  else if (ownership === "share" || ownership === "support") maloneDependency = "medium";
  else if (def.key.startsWith("integration.") && unkInt >= 1) maloneDependency = "high";
  else if (ownership === "unknown" && def.criticalForBid) maloneDependency = "medium";

  if (maloneDependency !== "low") {
    maloneResp.push(
      maloneDependency === "high"
        ? `Malone likely coordinates governance, oversight, or build for ${def.label} under current evidence.`
        : `Shared oversight expected between vendor and Malone for ${def.label}.`,
    );
  }

  let handoff: RoleRiskBand =
    ownership === "share" ? "high" : ownership === "support" ? "medium" : "low";
  if (ownership === "avoid" && def.criticalForBid) handoff = "high";

  let overlap: RoleRiskBand =
    ownership === "share" && ev === "weak" ? "high" : ownership === "share" ? "medium" : "low";
  if (ownership === "unknown") overlap = "medium";

  let gap: RoleRiskBand =
    ownership === "unknown" && def.criticalForBid ? "high" : ownership === "avoid" ? "high" : "low";
  if (ownership === "unknown") gap = gap === "high" ? "high" : "medium";

  let conf: "high" | "medium" | "low" = "medium";
  if (ev === "none" || ownership === "unknown") conf = "low";
  else if (ev === "strong" && (ownership === "own" || ownership === "share")) conf = "high";

  const rationale = [
    `${def.label} (${def.key}): fit dimensions ${def.relatedFitDimensions.join(", ") || "n/a"} → avg ${avg?.toFixed(2) ?? "n/a"}.`,
    `Claim support on related keys: ${claimSup}; evidence band ${ev}.`,
    `Ownership ${ownership} — Malone dependency ${maloneDependency}, handoff ${handoff}, overlap ${overlap}, gap ${gap}.`,
    "Heuristic role-fit for stack design — not a contractual assignment.",
  ].join(" ");

  return {
    roleKey: def.key,
    roleLabel: def.label,
    ownershipRecommendation: ownership,
    confidence: conf,
    fitLevel,
    evidenceStrength: ev,
    maloneDependencyLevel: maloneDependency,
    handoffComplexity: handoff,
    overlapRisk: overlap,
    gapRisk: gap,
    rationale,
    requiredMaloneResponsibilities: maloneResp.slice(0, 6),
    vendorStrengthSignals: strengths.slice(0, 6),
    vendorWeaknessSignals: weaknesses.slice(0, 6),
    unresolvedQuestions: unknowns.slice(0, 6),
  };
}

export function evaluateAllVendorRoles(
  ctx: RoleFitSimulationContext,
): EvaluatedVendorRole[] {
  return VENDOR_ROLE_TAXONOMY_V1.map((def) => evaluateVendorRole(def, ctx));
}

export function buildVendorRoleFitSummary(
  vendorId: string,
  roles: EvaluatedVendorRole[],
): {
  summary: {
    vendorId: string;
    strongOwnRoles: string[];
    shareRoles: string[];
    supportRoles: string[];
    avoidRoles: string[];
    highestDependencyRoles: string[];
    highestHandoffRiskRoles: string[];
    roleStrategyAssessment: RoleStrategyAssessment;
  };
} {
  const strongOwnRoles: string[] = [];
  const shareRoles: string[] = [];
  const supportRoles: string[] = [];
  const avoidRoles: string[] = [];
  const highDep: string[] = [];
  const highHandoff: string[] = [];

  for (const r of roles) {
    if (r.ownershipRecommendation === "own" && r.fitLevel === "strong")
      strongOwnRoles.push(r.roleKey);
    if (r.ownershipRecommendation === "share") shareRoles.push(r.roleKey);
    if (r.ownershipRecommendation === "support") supportRoles.push(r.roleKey);
    if (r.ownershipRecommendation === "avoid") avoidRoles.push(r.roleKey);
    if (r.maloneDependencyLevel === "high") highDep.push(r.roleKey);
    if (r.handoffComplexity === "high") highHandoff.push(r.roleKey);
  }

  let roleStrategyAssessment: RoleStrategyAssessment = "usable_with_malone_support";
  const criticalAvoid = roles.filter(
    (r) => CRITICAL_ROLE_KEYS.has(r.roleKey) && r.ownershipRecommendation === "avoid",
  );
  const criticalUnknown = roles.filter(
    (r) => CRITICAL_ROLE_KEYS.has(r.roleKey) && r.ownershipRecommendation === "unknown",
  );
  const criticalHighDep = roles.filter(
    (r) => CRITICAL_ROLE_KEYS.has(r.roleKey) && r.maloneDependencyLevel === "high",
  );

  if (criticalAvoid.length >= 2 || (criticalAvoid.length >= 1 && criticalUnknown.length >= 2)) {
    roleStrategyAssessment = "misaligned";
  } else if (criticalHighDep.length >= 3 || highDep.length >= 8) {
    roleStrategyAssessment = "fragile";
  } else if (
    strongOwnRoles.length >= 3 &&
    criticalAvoid.length === 0 &&
    criticalHighDep.length <= 1
  ) {
    roleStrategyAssessment = "clear_fit";
  }

  return {
    summary: {
      vendorId,
      strongOwnRoles: strongOwnRoles.slice(0, 12),
      shareRoles: shareRoles.slice(0, 14),
      supportRoles: supportRoles.slice(0, 10),
      avoidRoles: avoidRoles.slice(0, 10),
      highestDependencyRoles: highDep.slice(0, 8),
      highestHandoffRiskRoles: highHandoff.slice(0, 8),
      roleStrategyAssessment,
    },
  };
}
