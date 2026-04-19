import type { BidReviewSnapshot } from "@/lib/review-rules-engine";
import { activeIssues } from "@/lib/review-utils";
import type {
  EvaluatorConfidence,
  EvaluatorSectionScore,
  EvaluatorSimulationResult,
  ReadinessScore,
  ReviewIssue,
} from "@/types";
import type { GroundingBundlePricing } from "@/types/pricing-model";
import { S000000479_BID_NUMBER } from "@/data/canonical-rfp-s000000479";

const W_EXP = 210;
const W_SOL = 210;
const W_RISK = 70;
const W_INT = 210;
const W_COST = 300;

function clamp10(n: number): number {
  return Math.max(0, Math.min(10, n));
}

function sectionScore(
  section: EvaluatorSectionScore["section"],
  maxWeighted: number,
  raw: number,
  confidence: EvaluatorConfidence,
  rationale: string[],
  loss: string[],
  upgrade: string[],
): EvaluatorSectionScore {
  const r = Math.round(clamp10(raw) * 10) / 10;
  const weighted = Math.round(((r / 10) * maxWeighted + Number.EPSILON) * 10) / 10;
  return {
    section,
    rawScore: r,
    weightedScore: weighted,
    confidence,
    rationale: rationale.slice(0, 5),
    pointLossDrivers: loss.slice(0, 5),
    upgradeActions: upgrade.slice(0, 5),
  };
}

function sectionDraft(
  snapshot: BidReviewSnapshot,
  sectionType: "Experience" | "Solution" | "Risk",
) {
  const sec = snapshot.draftSections.find((s) => s.sectionType === sectionType);
  if (!sec) {
    return { sec: undefined, v: undefined, pr: undefined };
  }
  const v = snapshot.activeDraftBySection[sec.id];
  const pr = snapshot.groundedProseBySectionId?.[sec.id];
  return { sec, v, pr };
}

function confidenceFor(
  snapshot: BidReviewSnapshot,
  sectionHasGrounding: boolean,
): EvaluatorConfidence {
  const ev = snapshot.evidenceItems.length;
  if (ev >= 5 && sectionHasGrounding) return "high";
  if (ev >= 2 || sectionHasGrounding) return "medium";
  return "low";
}

function scoreExperience(
  snapshot: BidReviewSnapshot,
  issues: ReviewIssue[],
  readiness: ReadinessScore,
): EvaluatorSectionScore {
  const act = activeIssues(issues);
  const { v, pr } = sectionDraft(snapshot, "Experience");
  const hasBody = Boolean(v?.content?.trim());
  const grounded = Boolean(v?.groundingBundleId);
  let raw = 4.2;
  const rationale: string[] = [];
  const loss: string[] = [];
  const upgrade: string[] = [];

  if (hasBody) {
    raw += 0.9;
    rationale.push("Experience volume contains substantive narrative.");
  } else {
    loss.push(
      "Experience volume is thin — evaluators cannot verify past performance or institutional fit.",
    );
    upgrade.push("Populate Experience with citeable proof tied to the requirement matrix.");
  }

  if (grounded) {
    raw += 1.15;
    rationale.push("Grounding bundle links narrative to evidence and requirements.");
  } else if (hasBody) {
    raw -= 1.0;
    loss.push(
      "Polished Experience text without grounding reads assertive, not evidenced — a common scoring loss.",
    );
    upgrade.push("Attach a grounding bundle or narrow claims to provable facts.");
  }

  if (pr) {
    if (pr.confidence === "high") raw += 0.65;
    else if (pr.confidence === "medium") raw += 0.25;
    else {
      raw -= 1.0;
      loss.push("Grounded prose review flags low confidence for Experience.");
    }
    const u = pr.unsupported_claims.length;
    raw -= Math.min(2.4, u * 0.5);
    if (u > 0) {
      loss.push(
        `${u} unsupported claim(s) in Experience — evaluators may treat these as unreliability signals.`,
      );
      upgrade.push("Resolve or remove unsupported claims flagged in grounded review.");
    }
  } else if (hasBody) {
    raw -= 0.45;
    loss.push("No grounded prose pass on Experience — factual drift may be invisible until evaluation.");
    upgrade.push("Run grounded review on Experience before lock.");
  }

  const metN = act.filter((i) => i.issueType === "Weak Metrics Presence").length;
  const diffN = act.filter((i) => i.issueType === "Weak Differentiation Support").length;
  raw -= metN * 0.55 + diffN * 0.45;
  if (metN)
    loss.push(
      "Limited quantified proof — Arkansas evaluators often reward demonstrable reliability.",
    );
  if (diffN)
    loss.push("Differentiation is under-supported relative to proof and scoring cues.");

  const proofWeak = act.filter((i) => i.issueType === "Weak Requirement Proof").length;
  raw -= Math.min(1.5, proofWeak * 0.28);

  raw += (readiness.coverage / 100 - 0.52) * 2.0;
  raw += (readiness.grounding / 100 - 0.52) * 1.4;
  raw += (readiness.scoring_alignment / 100 - 0.52) * 0.9;

  return sectionScore(
    "Experience",
    W_EXP,
    raw,
    confidenceFor(snapshot, grounded),
    rationale,
    loss,
    upgrade,
  );
}

function scoreSolution(
  snapshot: BidReviewSnapshot,
  issues: ReviewIssue[],
  readiness: ReadinessScore,
): EvaluatorSectionScore {
  const act = activeIssues(issues);
  const { v, pr } = sectionDraft(snapshot, "Solution");
  const hasBody = Boolean(v?.content?.trim());
  const grounded = Boolean(v?.groundingBundleId);
  let raw = 4.3;
  const rationale: string[] = [];
  const loss: string[] = [];
  const upgrade: string[] = [];

  if (hasBody) {
    raw += 1.0;
    rationale.push("Solution volume addresses operational and workflow expectations.");
  } else {
    loss.push("Solution is incomplete — requirement coverage and HDC workflow clarity will score low.");
    upgrade.push("Finish Solution with concrete operating detail (not generic pharmacy language).");
  }

  if (grounded) {
    raw += 1.1;
    rationale.push("Grounding ties Solution claims to requirements and evidence.");
  } else if (hasBody) {
    raw -= 1.05;
    loss.push("Solution narrative without grounding invites “may be acceptable” (5-band) scoring.");
    upgrade.push("Ground Solution or tighten claims to verified interfaces and processes.");
  }

  if (pr) {
    const na = pr.requirement_findings.filter((f) => f.status === "not_addressed").length;
    raw -= Math.min(2.0, na * 0.35);
    if (na)
      loss.push(
        `${na} requirement thread(s) not clearly addressed in Solution — direct scoring exposure.`,
      );
    const u = pr.unsupported_claims.length;
    raw -= Math.min(2.0, u * 0.42);
    if (u) loss.push("Unsupported operational claims weaken Solution credibility.");
    if (pr.confidence === "low") {
      raw -= 0.85;
      loss.push("Low-confidence grounded review on Solution.");
    }
  }

  const techDense = act.filter((i) => i.issueType === "Technical Density Risk").length;
  raw -= techDense * 0.35;
  if (techDense)
    loss.push("Dense or template-heavy language may obscure operational clarity for evaluators.");

  raw += (readiness.coverage / 100 - 0.52) * 2.1;
  raw += (readiness.grounding / 100 - 0.52) * 1.6;
  raw += (readiness.scoring_alignment / 100 - 0.52) * 1.0;

  return sectionScore(
    "Solution",
    W_SOL,
    raw,
    confidenceFor(snapshot, grounded),
    rationale,
    loss,
    upgrade,
  );
}

function scoreRisk(
  snapshot: BidReviewSnapshot,
  issues: ReviewIssue[],
  readiness: ReadinessScore,
): EvaluatorSectionScore {
  const act = activeIssues(issues);
  const { v, pr } = sectionDraft(snapshot, "Risk");
  const hasBody = Boolean(v?.content?.trim());
  const grounded = Boolean(v?.groundingBundleId);
  let raw = 4.5;
  const rationale: string[] = [];
  const loss: string[] = [];
  const upgrade: string[] = [];

  if (hasBody) {
    raw += 0.85;
    rationale.push("Risk volume identifies material failure modes.");
  } else {
    loss.push("Risk section missing or skeletal — mitigation story may score at the bottom band.");
    upgrade.push("Document risks with mitigations tied to measurable controls.");
  }

  if (grounded) {
    raw += 0.95;
    rationale.push("Grounding supports mitigation claims with evidence.");
  } else if (hasBody) {
    raw -= 0.75;
    loss.push("Mitigation language without proof reads speculative under Arkansas review.");
    upgrade.push("Link mitigations to evidence or prior performance artifacts.");
  }

  const mitigGap = act.filter((i) => i.issueType === "Missing Mitigation Proof").length;
  raw -= Math.min(2.2, mitigGap * 0.55);
  if (mitigGap)
    loss.push(
      "Missing mitigation proof — evaluators may not credit controls you cannot demonstrate.",
    );

  if (pr?.contradictions.length) {
    raw -= Math.min(1.8, pr.contradictions.length * 0.5);
    loss.push("Contradictions in Risk undermine trust in the mitigation narrative.");
  }

  raw += (readiness.contract_readiness / 100 - 0.52) * 1.2;
  raw += (readiness.grounding / 100 - 0.52) * 1.0;

  return sectionScore(
    "Risk",
    W_RISK,
    raw,
    confidenceFor(snapshot, grounded),
    rationale,
    loss,
    upgrade,
  );
}

function scoreInterview(
  snapshot: BidReviewSnapshot,
  issues: ReviewIssue[],
  readiness: ReadinessScore,
): EvaluatorSectionScore {
  const act = activeIssues(issues);
  let raw = 4.8;
  const rationale: string[] = [];
  const loss: string[] = [];
  const upgrade: string[] = [];

  rationale.push(
    "Interview score reflects narrative coherence and defense readiness — not a prediction of oral performance.",
  );

  let contradictions = 0;
  for (const sec of snapshot.draftSections) {
    const pr = snapshot.groundedProseBySectionId?.[sec.id];
    if (pr) contradictions += pr.contradictions.length;
  }
  raw -= Math.min(2.5, contradictions * 0.45);
  if (contradictions)
    loss.push(
      `${contradictions} cross-volume contradiction(s) weaken interview defense and scoring confidence.`,
    );

  const lowConf = snapshot.draftSections.filter((s) => {
    const pr = snapshot.groundedProseBySectionId?.[s.id];
    return pr?.confidence === "low";
  }).length;
  raw -= Math.min(1.8, lowConf * 0.5);
  if (lowConf)
    loss.push("Low-confidence drafts suggest oral defense gaps even if volumes read well.");

  const contraIssues = act.filter((i) => i.issueType === "Draft Contradiction").length;
  raw -= Math.min(1.5, contraIssues * 0.4);

  raw += (readiness.scoring_alignment / 100 - 0.52) * 1.8;
  raw += (readiness.discussion_readiness / 100 - 0.52) * 1.4;
  raw += (readiness.grounding / 100 - 0.52) * 1.0;

  const scoringWeak = act.filter((i) => i.issueType === "Scoring Weakness").length;
  raw -= Math.min(1.2, scoringWeak * 0.25);

  return sectionScore(
    "Interview",
    W_INT,
    raw,
    contradictions === 0 && lowConf === 0 ? "medium" : "low",
    rationale,
    loss,
    upgrade,
  );
}

function scoreCost(
  bidNumber: string,
  layer: GroundingBundlePricing,
): EvaluatorSectionScore {
  let raw = 5.0;
  const rationale: string[] = [];
  const loss: string[] = [];
  const upgrade: string[] = [];

  const rfpMiss = layer.rfpCoverage.filter((r) => !r.ok);
  if (layer.ready && rfpMiss.length === 0) {
    raw += 2.2;
    rationale.push("Structured pricing covers required RFP service categories with contract-valid totals.");
  } else if (layer.model.items.length > 0 && layer.contractCompliant) {
    raw += 1.4;
    rationale.push("Pricing model is populated and totals reconcile — coverage gaps may still exist.");
    if (rfpMiss.length) {
      raw -= Math.min(2.0, rfpMiss.length * 0.45);
      loss.push(
        `RFP service coverage incomplete (${rfpMiss.map((x) => x.key).join(", ")}) — cost story may be challenged.`,
      );
      upgrade.push("Map line items explicitly to each required service category in the RFP.");
    }
  } else {
    raw -= 1.2;
    loss.push("Pricing structure is incomplete or not contract-compliant in the workbook.");
    upgrade.push("Complete structured pricing JSON on the official price sheet file or workbook.");
  }

  rationale.push(
    "Market competitiveness versus other offerors is not modeled here — assume unknown unless you add competitor benchmarks.",
  );
  loss.push(
    "Relative cost competitiveness vs other bidders is uncertain without external price intelligence.",
  );

  if (bidNumber === S000000479_BID_NUMBER && !layer.parsed && layer.ready) {
    rationale.push("Canonical pricing scaffold in use — replace with live workbook JSON when available.");
  }

  const conf: EvaluatorConfidence =
    layer.ready && layer.contractCompliant ? "medium" : "low";

  return sectionScore("Cost", W_COST, raw, conf, rationale, loss, upgrade);
}

function mergeTop(
  sections: EvaluatorSectionScore[],
  pick: (s: EvaluatorSectionScore) => string[],
  limit: number,
): string[] {
  const scored = sections.flatMap((s) =>
    pick(s).map((text) => ({ text, w: s.weightedScore })),
  );
  scored.sort((a, b) => a.w - b.w);
  const out: string[] = [];
  const seen = new Set<string>();
  for (const x of scored) {
    if (out.length >= limit) break;
    if (!x.text.trim() || seen.has(x.text)) continue;
    seen.add(x.text);
    out.push(x.text);
  }
  return out;
}

export function computeEvaluatorSimulation(input: {
  snapshot: BidReviewSnapshot;
  issues: ReviewIssue[];
  readiness: ReadinessScore;
  pricingLayer: GroundingBundlePricing;
  bidNumber: string;
}): EvaluatorSimulationResult {
  const { snapshot, issues, readiness, pricingLayer, bidNumber } = input;
  const act = activeIssues(issues);

  const exp = scoreExperience(snapshot, issues, readiness);
  const solution = scoreSolution(snapshot, issues, readiness);
  const risk = scoreRisk(snapshot, issues, readiness);
  const interview = scoreInterview(snapshot, issues, readiness);
  const cost = scoreCost(bidNumber, pricingLayer);

  const technicalTotal =
    exp.weightedScore +
    solution.weightedScore +
    risk.weightedScore +
    interview.weightedScore;
  const grandTotal = technicalTotal + cost.weightedScore;

  const sections = [exp, solution, risk, interview, cost];

  const topPointLossDrivers = mergeTop(
    sections,
    (s) => s.pointLossDrivers,
    8,
  );
  const topUpgradeActions = mergeTop(sections, (s) => s.upgradeActions, 8);

  let overallAssessment: EvaluatorSimulationResult["overallAssessment"] =
    "competitive";
  if (act.some((i) => i.severity === "Critical")) {
    overallAssessment = "not_ready";
  } else if (grandTotal < 420) {
    overallAssessment = "not_ready";
  } else if (grandTotal < 580) {
    overallAssessment = "fragile";
  } else if (grandTotal >= 780 && technicalTotal >= 520) {
    overallAssessment = "strong";
  } else {
    overallAssessment = "competitive";
  }

  if (readiness.overall < 42) {
    overallAssessment = "not_ready";
  }

  return {
    technical: {
      experience: exp,
      solution,
      risk,
      interview,
      totalTechnicalScore:
        Math.round((technicalTotal + Number.EPSILON) * 10) / 10,
    },
    cost,
    grandTotalScore: Math.round((grandTotal + Number.EPSILON) * 10) / 10,
    overallAssessment,
    topPointLossDrivers,
    topUpgradeActions,
  };
}
