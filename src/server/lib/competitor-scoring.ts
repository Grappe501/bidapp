/**
 * Competitor-aware comparative scoring: bid-linked, provenance-aware, no false precision.
 * Scores are relative composites for THIS solicitation, not universal vendor quality.
 */

import type {
  CompetitorComparisonEntry,
  CompetitorHeatmapMatrix,
  CompetitorRecommendationConfidence,
  HeatmapCellStatus,
} from "../../types";

export const HEATMAP_THEME_ROWS: readonly {
  id: string;
  label: string;
  keywords: RegExp;
}[] = [
  { id: "support_24_7", label: "24/7 support", keywords: /24\s*[/\s]*7|after[\s-]*hours|on[\s-]*call/i },
  { id: "emergency_delivery", label: "Emergency delivery", keywords: /emergency|stat|urgent|same[\s-]*day|courier/i },
  { id: "matrixcare_ehr", label: "MatrixCare / EHR integration", keywords: /matrixcare|ehr|emr|integration|hl7|fhir/i },
  { id: "billing_medicaid", label: "Billing / Medicaid coordination", keywords: /medicaid|billing|coordination|claims|payer/i },
  { id: "security_residency", label: "Security / data protection", keywords: /hipaa|security|encrypt|breach|audit|phi/i },
  { id: "reporting_audit", label: "Reporting / auditability", keywords: /report|audit|dashboard|metric|compliance/i },
  { id: "implementation_timeline", label: "Implementation timeline", keywords: /implement|rollout|go[\s-]*live|timeline|phase|weeks|months/i },
  { id: "staffing_continuity", label: "Staffing / continuity", keywords: /staff|pharmacist|credential|turnover|continuity/i },
  { id: "pricing_commercial", label: "Commercial / pricing support", keywords: /pric|cost|fee|contract|commercial/i },
  { id: "interview_defense", label: "Interview defensibility", keywords: /reference|pilot|case study|award|state|agency/i },
];

export function classifyHeatmapCell(input: {
  corpus: string;
  keywords: RegExp;
  verifiedFactHints: number;
  unverifiedClaimRatio: number;
}): HeatmapCellStatus {
  const hit = input.keywords.test(input.corpus);
  if (!hit) return "unknown";
  if (input.unverifiedClaimRatio > 0.65) return "gap";
  if (input.verifiedFactHints >= 2) return "met";
  if (input.verifiedFactHints >= 1 || input.unverifiedClaimRatio < 0.45)
    return "partial";
  return "partial";
}

function clamp(n: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, n));
}

function dimScore(
  byKey: Record<string, { score: number; confidence: string }>,
  key: string,
): number {
  const row = byKey[key];
  if (!row) return 50;
  const base = (row.score / 5) * 100;
  const c = (row.confidence ?? "").toLowerCase();
  const pen = c === "high" ? 1 : c === "medium" ? 0.92 : c === "low" ? 0.78 : 0.85;
  return clamp(base * pen, 15, 100);
}

function evidenceQuality(input: {
  operationalClaimShare: number;
  verifiedFactCount: number;
  unknownIntegrationCount: number;
}): "high" | "medium" | "low" {
  if (input.unknownIntegrationCount >= 4) return "low";
  if (input.verifiedFactCount >= 6 && input.operationalClaimShare >= 0.35)
    return "high";
  if (input.verifiedFactCount >= 2 || input.operationalClaimShare >= 0.25)
    return "medium";
  return "low";
}

export type VendorScoreInput = {
  vendorId: string;
  vendorName: string;
  fitByKey: Record<string, { score: number; confidence: string; rationale: string }>;
  corpus: string;
  claims: Array<{ credibility: string; confidence: string; claimText: string }>;
  facts: Array<{ credibility: string; confidence: string; factText: string; factType: string }>;
  integrationRows: Array<{ requirementKey: string; status: string; evidence: string }>;
  inArchitectureOption: boolean;
  mandatoryReqOverlapRatio: number;
};

export function buildVendorComparisonEntry(input: VendorScoreInput): CompetitorComparisonEntry {
  const byKey = input.fitByKey;
  const technicalFitScore = dimScore(byKey, "technical_capability");
  const integrationScore = dimScore(byKey, "integration_fit");
  const deliveryScore = dimScore(byKey, "delivery_operations");
  const riskPosture = dimScore(byKey, "risk_posture");
  const refs = dimScore(byKey, "references_proof");

  const opClaims = input.claims.filter(
    (c) => c.credibility.toLowerCase() === "operational",
  ).length;
  const opShare =
    input.claims.length > 0 ? opClaims / input.claims.length : 0;
  const verifiedFacts = input.facts.filter(
    (f) =>
      f.credibility.toLowerCase() === "operational" &&
      (f.confidence === "high" || f.confidence === "medium"),
  ).length;
  const unverifiedRatio =
    input.claims.length > 0
      ? input.claims.filter((c) => c.confidence.toLowerCase() === "low")
          .length / input.claims.length
      : 0;
  const unknownInt = input.integrationRows.filter((r) => r.status === "unknown")
    .length;

  const conf = evidenceQuality({
    operationalClaimShare: opShare,
    verifiedFactCount: verifiedFacts,
    unknownIntegrationCount: unknownInt,
  });

  const complianceScore = clamp(input.mandatoryReqOverlapRatio * 100, 10, 100);
  const commercialHint = /pric|cost|fee|contract/i.test(input.corpus) ? 62 : 45;

  let overall =
    technicalFitScore * 0.22 +
    integrationScore * 0.22 +
    deliveryScore * 0.18 +
    riskPosture * 0.18 +
    refs * 0.12 +
    complianceScore * 0.08;
  if (conf === "low") overall = overall * 0.92;
  if (conf === "high") overall = Math.min(100, overall * 1.02);
  if (input.inArchitectureOption) overall = Math.min(100, overall + 4);

  overall = clamp(Math.round(overall), 18, 100);

  const heatmap: Record<string, HeatmapCellStatus> = {};
  for (const row of HEATMAP_THEME_ROWS) {
    heatmap[row.id] = classifyHeatmapCell({
      corpus: input.corpus,
      keywords: row.keywords,
      verifiedFactHints: verifiedFacts,
      unverifiedClaimRatio: unverifiedRatio,
    });
  }

  const topAdvantages: string[] = [];
  const topDisadvantages: string[] = [];
  const criticalGaps: string[] = [];
  const integrationBurdens: string[] = [];
  const mustAskQuestions: string[] = [];

  if (integrationScore >= 72)
    topAdvantages.push("Stronger integration-fit signal vs typical alternatives for this bid.");
  if (refs >= 68)
    topAdvantages.push("Reference / proof signals improve Experience and Interview defensibility.");
  if (input.inArchitectureOption)
    topAdvantages.push("Vendor is on the active architecture path — aligns evaluator Solution narrative.");

  if (technicalFitScore < 48)
    topDisadvantages.push("Technical fit dimension is weak vs solicitation emphasis — Solution may score thin.");
  if (unknownInt >= 2) {
    topDisadvantages.push("Multiple integration requirement rows are unknown — Solution/Risk may face challenge questions.");
    criticalGaps.push("Unresolved integration touchpoints for this solicitation.");
  }
  if (unverifiedRatio > 0.45)
    topDisadvantages.push("High share of low-confidence vendor claims — treat as marketing until proven.");
  for (const r of input.integrationRows) {
    if (r.status === "gap" || r.status === "unknown")
      integrationBurdens.push(`${r.requirementKey}: ${r.status} — ${r.evidence.slice(0, 120)}`);
  }
  if (criticalGaps.length === 0 && unknownInt > 0)
    mustAskQuestions.push(
      "Confirm each unknown integration requirement with written evidence before proposal lock.",
    );

  const evaluatorBidScoreImpact = {
    experienceImpact: clamp(Math.round((refs - 55) / 12), -6, 6),
    solutionImpact: clamp(Math.round((integrationScore + technicalFitScore - 105) / 18), -6, 6),
    riskImpact: clamp(Math.round((riskPosture - 55) / 14), -6, 6),
    interviewImpact: clamp(
      Math.round((refs - unverifiedRatio * 40 - 45) / 10),
      -6,
      6,
    ),
  };

  return {
    vendorId: input.vendorId,
    vendorName: input.vendorName,
    overallScore: overall,
    confidence: conf,
    technicalFitScore: Math.round(technicalFitScore),
    integrationScore: Math.round(integrationScore),
    deliveryScore: Math.round(deliveryScore),
    riskScore: Math.round(riskPosture),
    complianceScore: Math.round(complianceScore),
    commercialScore: commercialHint,
    evaluatorBidScoreImpact,
    topAdvantages: topAdvantages.slice(0, 5),
    topDisadvantages: topDisadvantages.slice(0, 5),
    criticalGaps: criticalGaps.slice(0, 5),
    integrationBurdens: integrationBurdens.slice(0, 6),
    mustAskQuestions: mustAskQuestions.slice(0, 4),
    heatmap,
  };
}

export function buildHeatmapMatrix(
  entries: CompetitorComparisonEntry[],
): CompetitorHeatmapMatrix {
  const rows = HEATMAP_THEME_ROWS.map((r) => ({
    id: r.id,
    label: r.label,
    cells: Object.fromEntries(
      entries.map((e) => [e.vendorId, e.heatmap?.[r.id] ?? "unknown"]),
    ) as Record<string, HeatmapCellStatus>,
  }));
  return { rows };
}

export function buildPointLossComparisons(
  entries: CompetitorComparisonEntry[],
): string[] {
  if (entries.length < 2) return [];
  const sorted = [...entries].sort((a, b) => b.overallScore - a.overallScore);
  const lead = sorted[0];
  const runner = sorted[1];
  const out: string[] = [];
  if (!lead || !runner) return out;

  out.push(
    `${lead.vendorName} leads on composite bid competitiveness (${lead.overallScore} vs ${runner.overallScore}) — interpretive, not a prediction.`,
  );

  const di = lead.integrationScore - runner.integrationScore;
  if (Math.abs(di) >= 8) {
    out.push(
      di > 0
        ? `${lead.vendorName} likely strengthens Solution scoring vs ${runner.vendorName} on integration evidence and fit.`
        : `${runner.vendorName} shows stronger integration signals than ${lead.vendorName} — selection may shift Solution proof priorities.`,
    );
  }

  const dr = lead.evaluatorBidScoreImpact.riskImpact - runner.evaluatorBidScoreImpact.riskImpact;
  if (Math.abs(dr) >= 2) {
    out.push(
      dr >= 0
        ? `Risk volume posture may be slightly safer with ${lead.vendorName} than ${runner.vendorName} given current evidence (Δ risk impact ≈ ${dr}).`
        : `${runner.vendorName} may carry lower residual risk narrative than ${lead.vendorName} — verify with mitigation language.`,
    );
  }

  out.push(
    "Vendor-claim-only proof scores lower than operational facts — do not treat marketing claims as verified in evaluator Q&A.",
  );

  return out.slice(0, 8);
}

export function buildRecommendation(input: {
  entries: CompetitorComparisonEntry[];
  architectureOptionName?: string;
}): {
  recommendedVendorId?: string;
  recommendedRationale: string[];
  decisionRisks: string[];
  scenarioNotes: string[];
  recommendationConfidence: CompetitorRecommendationConfidence;
} {
  const sorted = [...input.entries].sort((a, b) => b.overallScore - a.overallScore);
  const lead = sorted[0];
  const second = sorted[1];
  if (!lead) {
    return {
      recommendedRationale: ["No vendors to compare."],
      decisionRisks: [],
      scenarioNotes: [],
      recommendationConfidence: "provisional",
    };
  }

  const gap = second ? lead.overallScore - second.overallScore : 100;
  const tight = gap < 6;
  const conf: CompetitorRecommendationConfidence =
    lead.confidence === "high" && !tight
      ? "high"
      : lead.confidence === "medium" && !tight
        ? "medium"
        : tight
          ? "provisional"
          : "low";

  const recommendedRationale: string[] = [
    `${lead.vendorName} is the current leading option for this solicitation's evidence-backed competitiveness (composite ${lead.overallScore}/100, confidence ${lead.confidence}).`,
  ];
  if (second) {
    recommendedRationale.push(
      tight
        ? `${second.vendorName} is within a tight band — treat recommendation as provisional until proof gaps close.`
        : `Runner-up: ${second.vendorName} (${second.overallScore}) — revisit if integration or reference proof improves.`,
    );
  }
  if (input.architectureOptionName) {
    recommendedRationale.push(
      `Architecture context: ${input.architectureOptionName} — stack role alignment affects Solution/Risk narrative, not just vendor abstract quality.`,
    );
  }

  const decisionRisks: string[] = [];
  if (lead.confidence !== "high")
    decisionRisks.push(
      "Evidence confidence is not high — recommendation may change with stronger references or verified integration artifacts.",
    );
  if (lead.criticalGaps.length)
    decisionRisks.push(...lead.criticalGaps.slice(0, 3));
  if (tight)
    decisionRisks.push("Scores are near-equal — leadership should use interview tie-breakers before lock.");

  const scenarioNotes = [
    "Switching vendor changes Solution proof obligations, Risk mitigations, and Interview lines — rebuild grounding bundles after selection.",
  ];

  return {
    recommendedVendorId: lead.vendorId,
    recommendedRationale,
    decisionRisks,
    scenarioNotes,
    recommendationConfidence: conf,
  };
}

export function buildCompetitorInterviewQuestions(
  entries: CompetitorComparisonEntry[],
): string[] {
  const sorted = [...entries].sort((a, b) => b.overallScore - a.overallScore);
  const lead = sorted[0];
  const weak = sorted[sorted.length - 1];
  const qs: string[] = [];
  if (lead) {
    qs.push(
      `For ${lead.vendorName} (preferred): what single artifact closes the largest remaining proof gap before submission?`,
    );
  }
  if (weak && lead && weak.vendorId !== lead.vendorId) {
    qs.push(
      `Challenge for ${weak.vendorName}: justify why Solution scoring would not suffer vs ${lead.vendorName} on integration evidence.`,
    );
  }
  if (entries.length >= 2) {
    const a = entries[0];
    const b = entries[1];
    if (a && b && Math.abs(a.overallScore - b.overallScore) < 8) {
      qs.push(
        `Tie-breaker: compare live MatrixCare / EHR touchpoints and escalation paths for ${a.vendorName} vs ${b.vendorName}.`,
      );
    }
  }
  return qs.slice(0, 8);
}
