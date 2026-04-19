import type {
  DraftMetadata,
  DraftSectionType,
  DraftVersion,
  GroundingBundlePayload,
  ScoringCategory,
} from "@/types";
import { SECTION_SUPPORT_EXPECTATIONS } from "@/server/lib/drafting-constants";
import { MOCK_SCORING_CATEGORIES, SCORING_TOTAL_POINTS } from "@/data/mockScoringModel";

export const DRAFT_WORDS_PER_PAGE = 450;

/** Section caps and evaluator focus (aligned with BP-005.5 constraints + BP-006). */
export const SECTION_FOCUS: Record<
  DraftSectionType,
  { maxPages: number; focus: string }
> = {
  Experience: {
    maxPages: 2,
    focus:
      "Proof-first: quantified outcomes, references, and artifacts evaluators can score — not generic excellence claims.",
  },
  Solution: {
    maxPages: 2,
    focus:
      "Criterion-led: tie themes to scored requirements; state outcomes before depth — avoid technical tours that do not map to evaluation.",
  },
  Risk: {
    maxPages: 2,
    focus:
      "Defensible posture: material risks with mitigation, owner, and evidence — consistent with written record and oral defense.",
  },
  Interview: {
    maxPages: 2,
    focus:
      "Oral defense: operational confidence, pricing justification, and Q&A readiness — same facts as Solution/Risk, no improvisation.",
  },
  "Executive Summary": {
    maxPages: 1,
    focus: "Disciplined overview; no new unsupported claims.",
  },
  "Architecture Narrative": {
    maxPages: 2,
    focus: "Stack roles, integration, Malone orchestration, partner boundaries.",
  },
};

export function countWords(text: string): number {
  const t = text.trim();
  if (!t) return 0;
  return t.split(/\s+/).length;
}

export function estimatePagesFromWords(words: number): number {
  return Math.round((words / DRAFT_WORDS_PER_PAGE) * 10) / 10;
}

export type PageOverflowRisk = "ok" | "near" | "over";

export function pageOverflowRisk(
  estimatedPages: number,
  maxPages: number,
): PageOverflowRisk {
  if (estimatedPages > maxPages) return "over";
  if (estimatedPages > maxPages * 0.92) return "near";
  return "ok";
}

export type CoverageHealth = "complete" | "partial" | "weak";

export function coverageHealth(
  meta: DraftMetadata | null,
  bundleRequirementCount: number,
  bundle?: GroundingBundlePayload | null,
): CoverageHealth {
  if (!meta) return "weak";
  const miss = meta.missingRequirementIds.length;
  const sup = bundle?.requirementSupport;
  const cov = meta.requirementCoverageIds;

  if (
    miss === 0 &&
    meta.unsupportedClaimFlags.length === 0 &&
    bundleRequirementCount > 0
  ) {
    if (sup && cov.length > 0) {
      const thin = cov.filter((id) => {
        const level = sup[id]?.level ?? "none";
        return level !== "strong";
      }).length;
      if (thin >= Math.max(1, Math.ceil(cov.length * 0.4))) return "weak";
      if (thin > 0) return "partial";
    }
    return "complete";
  }
  if (bundleRequirementCount === 0) {
    return meta.unsupportedClaimFlags.length === 0 ? "partial" : "weak";
  }
  if (miss <= Math.max(1, Math.ceil(bundleRequirementCount * 0.35))) {
    return "partial";
  }
  return "weak";
}

export type ScoreStrength = "Strong" | "Moderate" | "Weak";

export function scoringStrength(
  sectionType: DraftSectionType,
  meta: DraftMetadata | null,
  bundle?: GroundingBundlePayload | null,
): ScoreStrength {
  if (!meta) return "Weak";
  const review = meta.groundedProseReview;
  if (review && review.contradictions.length >= 2) return "Weak";
  if (review && review.unsupported_claims.length > 2) return "Weak";

  if (bundle?.requirementSupport && bundle.requirements.length > 0) {
    let noneN = 0;
    for (const r of bundle.requirements) {
      const s = bundle.requirementSupport[r.id];
      if (!s || s.level === "none") noneN += 1;
    }
    if (noneN / bundle.requirements.length > 0.45) return "Weak";
  }

  if (meta.riskFlags.length > 2 || meta.unsupportedClaimFlags.length > 1) {
    return "Weak";
  }
  if (meta.missingRequirementIds.length > 2) return "Weak";
  if (meta.missingRequirementIds.length > 0 || meta.riskFlags.length > 0) {
    return "Moderate";
  }
  void sectionType;
  return "Strong";
}

export function scoringCategoriesForSection(
  sectionType: DraftSectionType,
): ScoringCategory[] {
  const primary: Record<DraftSectionType, string[]> = {
    Experience: ["Experience"],
    Solution: ["Solution"],
    Risk: ["Risk"],
    Interview: ["Interview", "Cost", "Solution", "Risk"],
    "Executive Summary": [
      "Experience",
      "Solution",
      "Risk",
      "Interview",
      "Cost",
    ],
    "Architecture Narrative": ["Solution", "Risk"],
  };
  const names = new Set(primary[sectionType]);
  return MOCK_SCORING_CATEGORIES.filter((c) => names.has(c.name));
}

export function pointsLabel(weight: number): string {
  const pts = Math.round(weight * SCORING_TOTAL_POINTS);
  return `${pts} / ${SCORING_TOTAL_POINTS}`;
}

export type ConstraintGuidanceSeverity = "critical" | "attention" | "advisory";

export type ConstraintGuidanceItem = {
  severity: ConstraintGuidanceSeverity;
  message: string;
};

/** Section-specific constraint and discipline guidance (metadata + optional bundle heuristics). */
export function buildConstraintGuidance(input: {
  sectionType: DraftSectionType;
  meta: DraftMetadata | null;
  maxPages: number;
  bundle: GroundingBundlePayload | null;
}): ConstraintGuidanceItem[] {
  const { sectionType, meta, maxPages, bundle } = input;
  const items: ConstraintGuidanceItem[] = [];
  if (!meta) return items;

  const risk = pageOverflowRisk(meta.estimatedPages, maxPages);
  if (risk === "over") {
    items.push({
      severity: "critical",
      message: `Page budget exceeded (~${meta.estimatedPages} vs ${maxPages} max). Condense, split themes, or regenerate with a tighter scope.`,
    });
  } else if (risk === "near") {
    items.push({
      severity: "attention",
      message: `Near page cap (~${meta.estimatedPages} / ${maxPages}). Remove redundancy so evaluators see scored content first.`,
    });
  }

  if (meta.unsupportedClaimFlags.length > 0) {
    items.push({
      severity: meta.unsupportedClaimFlags.length > 1 ? "critical" : "attention",
      message:
        meta.unsupportedClaimFlags.length > 1
          ? `${meta.unsupportedClaimFlags.length} unsupported-claim flags — resolve before approval (qualify, cite bundle evidence, or remove).`
          : "Unsupported-claim flag — tie the statement to evidence or soften it before submission.",
    });
  }

  const missN = meta.missingRequirementIds.length;
  const strength = scoringStrength(sectionType, meta, bundle);

  if (sectionType === "Experience") {
    if (missN > 0) {
      items.push({
        severity: missN > 2 ? "attention" : "advisory",
        message: `Experience scoring favors proof: ${missN} requirement(s) still read as uncovered — add metrics, baselines, or references.`,
      });
    }
  }

  if (sectionType === "Solution") {
    if (missN > 0) {
      items.push({
        severity: "attention",
        message:
          "Solution: missing requirement hooks read as generic — map paragraphs to criteria evaluators score.",
      });
    }
    if (strength !== "Strong") {
      items.push({
        severity: "advisory",
        message:
          "Solution: prioritize non-technical clarity; keep stack detail only where it earns points.",
      });
    }
  }

  if (sectionType === "Risk") {
    if (missN > 0) {
      items.push({
        severity: "attention",
        message: `Risk: ${missN} uncovered requirement(s) — each material risk should pair mitigation, owner, and proof or an explicit gap.`,
      });
    }
    if (meta.riskFlags.length > 0) {
      items.push({
        severity: "attention",
        message:
          "Structured risk flags present — confirm mitigation structure and interview consistency.",
      });
    }
  }

  if (sectionType === "Executive Summary" && missN > 0) {
    items.push({
      severity: "attention",
      message:
        "Executive summary should mirror scored volumes — uncovered requirement references may signal drift from underlying sections.",
    });
  }

  if (sectionType === "Interview" && missN > 0) {
    items.push({
      severity: "attention",
      message: `Interview: ${missN} uncovered requirement hook(s) — oral narrative should trace to the same scored scope as Solution/Risk.`,
    });
  }

  if (sectionType === "Architecture Narrative" && missN > 0) {
    items.push({
      severity: "advisory",
      message:
        "Architecture narrative should align with Solution/Risk — close coverage gaps so integration boundaries stay credible.",
    });
  }

  if (bundle) {
    const stats = getGroundingBundleStats(bundle);
    if (stats.gapCount >= 3) {
      items.push({
        severity: "advisory",
        message: `Grounding bundle records ${stats.gapCount} gaps — strengthen evidence or regenerate before final review.`,
      });
    }
    if (stats.evidenceCount === 0 && stats.requirementCount > 0) {
      items.push({
        severity: "attention",
        message:
          "Grounding bundle lists requirements but no evidence rows — claims will be harder to defend in evaluation.",
      });
    }
    const sup = bundle.requirementSupport;
    if (sup && bundle.requirements.length > 0) {
      const noneN = bundle.requirements.filter((r) => {
        const s = sup[r.id];
        return !s || s.level === "none";
      }).length;
      if (noneN > 0) {
        items.push({
          severity: noneN >= 2 ? "attention" : "advisory",
          message: `${noneN} requirement(s) in this bundle have no proof-graph evidence — link evidence and run “build proof graph” before treating support as defensible.`,
        });
      }
    }
    const pr = bundle.pricing;
    if (
      pr &&
      !pr.ready &&
      (sectionType === "Solution" ||
        sectionType === "Risk" ||
        sectionType === "Interview" ||
        sectionType === "Executive Summary")
    ) {
      items.push({
        severity: "attention",
        message:
          "Pricing model on this bundle is not fully validated (RFP service coverage or contract totals) — qualify cost claims or rebuild bundle after fixing the price sheet.",
      });
    }
  }

  const order: Record<ConstraintGuidanceSeverity, number> = {
    critical: 0,
    attention: 1,
    advisory: 2,
  };
  const seen = new Set<string>();
  return items
    .filter((i) => {
      if (seen.has(i.message)) return false;
      seen.add(i.message);
      return true;
    })
    .sort((a, b) => order[a.severity] - order[b.severity]);
}

export function buildConstraintMessages(input: {
  sectionType: DraftSectionType;
  meta: DraftMetadata | null;
  maxPages: number;
  bundle?: GroundingBundlePayload | null;
}): string[] {
  return buildConstraintGuidance({
    sectionType: input.sectionType,
    meta: input.meta,
    maxPages: input.maxPages,
    bundle: input.bundle ?? null,
  }).map((g) => g.message);
}

/** One row for coverage UI (title from bundle when available). */
export type RequirementCoverageRow = {
  id: string;
  label: string;
  subtitle?: string;
};

export type CoverageAnalysis = {
  bundleRequirementCount: number;
  bundleWeakEvidenceCount: number;
  coveredCount: number;
  missingCount: number;
  weakSupportCount: number;
  unsupportedClaimCount: number;
  covered: RequirementCoverageRow[];
  missing: RequirementCoverageRow[];
  weaklySupported: RequirementCoverageRow[];
};

function shortReqId(id: string): string {
  return id.length > 14 ? `${id.slice(0, 12)}…` : id;
}

/** Evidence rows marked pending/unverified in the grounding bundle (coverage heuristics). */
export function countBundleWeakVerificationEvidence(
  bundle: GroundingBundlePayload,
): number {
  return bundle.evidence.filter((e) =>
    /unverified|pending/i.test(String(e.validationStatus ?? "")),
  ).length;
}

/**
 * Interprets requirement coverage from bundle + structured metadata.
 * When {@link GroundingBundlePayload.requirementSupport} is present, limited proof replaces the old
 * risk/status heuristic for the “weak support” list.
 */
export function analyzeRequirementCoverage(
  bundle: GroundingBundlePayload | null,
  metadata: DraftMetadata | null,
): CoverageAnalysis | null {
  if (!bundle || !metadata) return null;

  const reqById = new Map(bundle.requirements.map((r) => [r.id, r]));
  const labelFor = (id: string): RequirementCoverageRow => {
    const r = reqById.get(id);
    const label = r?.title?.trim()
      ? r.title.length > 72
        ? `${r.title.slice(0, 70)}…`
        : r.title
      : `Requirement ${shortReqId(id)}`;
    const subtitle = r?.summary?.trim()
      ? r.summary.length > 100
        ? `${r.summary.slice(0, 98)}…`
        : r.summary
      : undefined;
    return { id, label, subtitle };
  };

  const coveredIds = metadata.requirementCoverageIds;
  const missingIds = metadata.missingRequirementIds;

  const weaklySupportedIds = bundle.requirementSupport
    ? coveredIds.filter((id) => {
        const s = bundle.requirementSupport![id];
        const level = s?.level ?? "none";
        return (
          level === "weak" || level === "none" || level === "partial"
        );
      })
    : coveredIds.filter((id) => {
        const r = reqById.get(id);
        if (!r) return false;
        const rl = (r.riskLevel ?? "").toLowerCase();
        if (rl === "high" || rl === "critical") return true;
        const st = (r.status ?? "").toLowerCase();
        return (
          st.includes("pending") ||
          st.includes("gap") ||
          st.includes("open") ||
          st.includes("tbd")
        );
      });

  const listLimit = 10;

  return {
    bundleRequirementCount: bundle.requirements.length,
    bundleWeakEvidenceCount: countBundleWeakVerificationEvidence(bundle),
    coveredCount: coveredIds.length,
    missingCount: missingIds.length,
    weakSupportCount: weaklySupportedIds.length,
    unsupportedClaimCount: metadata.unsupportedClaimFlags.length,
    covered: coveredIds.slice(0, listLimit).map(labelFor),
    missing: missingIds.slice(0, listLimit).map(labelFor),
    weaklySupported: weaklySupportedIds.slice(0, listLimit).map((id) => {
      const base = labelFor(id);
      if (bundle.requirementSupport) {
        const sup = bundle.requirementSupport[id];
        const level = sup?.level ?? "none";
        return {
          ...base,
          subtitle:
            base.subtitle ??
            `Proof-graph support is “${level}” for this requirement — add or verify evidence, then rebuild the proof graph.`,
        };
      }
      return {
        ...base,
        subtitle:
          base.subtitle ??
          "Marked high/critical or open in the bundle — confirm proof in the draft.",
      };
    }),
  };
}

/** What evaluators weight for this volume (plain language). */
export const SECTION_SCORING_LENS: Record<DraftSectionType, string> = {
  Experience:
    "Evaluators look for measurable performance, scale, reliability, and traceable proof — not generic claims of excellence.",
  Solution:
    "Evaluators reward clarity, direct fit to requirements, and defensible outcomes — not deep technical tours without scoring linkage.",
  Risk:
    "Evaluators expect credible risks, mitigations, and documented performance — boilerplate undermines trust.",
  Interview:
    "Interview panel tests whether oral answers match written volumes, pricing, and contract posture — inconsistency loses points.",
  "Executive Summary":
    "Evaluators skim for coherence, disciplined positioning, and alignment with scored volumes — no new ungrounded facts.",
  "Architecture Narrative":
    "Evaluators need strategic clarity on integration, boundaries, and orchestration — consistent with Solution and Risk.",
};

export const SECTION_EVALUATOR_TIPS: Record<DraftSectionType, string[]> = {
  Experience: [
    "Lead with outcomes evaluators can score (metrics, references, scope).",
    "Name evidence paths — artifacts, contracts, or operational data.",
  ],
  Solution: [
    "State the “so what” before the “how.”",
    "Tie each major point to a requirement or sub-factor.",
  ],
  Risk: [
    "Pair every material risk with mitigation and residual posture.",
    "Keep oral defense and written narrative aligned.",
  ],
  Interview: [
    "Rehearse answers that map to Solution, Risk, and the price sheet — same numbers and commitments.",
    "Lead with operational control, then cost justification; never sound surprised by your own pricing.",
  ],
  "Executive Summary": [
    "Mirror the volumes; flag where work is still open.",
    "Keep claims proportionate to proof elsewhere.",
  ],
  "Architecture Narrative": [
    "Clarify who owns what across partners and platforms.",
    "Avoid orphan components that do not appear in Solution/Risk.",
  ],
};

export type ScoringStrengthExplanation = {
  strength: ScoreStrength;
  driverLines: string[];
  sectionLens: string;
  evaluatorTips: string[];
};

/** Explains score strength using the same rules as {@link scoringStrength} — careful, metadata-bound language. */
export function explainScoringStrength(
  sectionType: DraftSectionType,
  meta: DraftMetadata | null,
  bundle?: GroundingBundlePayload | null,
): ScoringStrengthExplanation {
  const strength = scoringStrength(sectionType, meta, bundle);
  const driverLines: string[] = [];
  const sectionLens = SECTION_SCORING_LENS[sectionType];
  const evaluatorTips = [...SECTION_EVALUATOR_TIPS[sectionType]];

  if (!meta) {
    driverLines.push(
      "No structured metadata is attached to this version yet — generate or save a version to assess alignment.",
    );
    return { strength, driverLines, sectionLens, evaluatorTips };
  }

  if (bundle?.requirementSupport && bundle.requirements.length > 0) {
    const noneN = bundle.requirements.filter((r) => {
      const s = bundle.requirementSupport![r.id];
      return !s || s.level === "none";
    }).length;
    if (noneN > 0) {
      driverLines.push(
        `${noneN} requirement(s) in the bundle have no proof-graph evidence — scoring reads as weaker until evidence is linked.`,
      );
    }
  }

  const gReview = meta.groundedProseReview;
  if (gReview && gReview.contradictions.length > 0) {
    driverLines.push(
      `${gReview.contradictions.length} grounded-review mismatch(es) — reconcile draft language with vendor facts or architecture notes.`,
    );
  }

  if (meta.unsupportedClaimFlags.length > 1) {
    driverLines.push(
      `${meta.unsupportedClaimFlags.length} unsupported-claim flags in metadata — these are model-marked areas where proof may be thin.`,
    );
  } else if (meta.unsupportedClaimFlags.length === 1) {
    driverLines.push(
      "One unsupported-claim flag — tighten language or add evidence before evaluators read it as over-claiming.",
    );
  }

  if (meta.missingRequirementIds.length > 2) {
    driverLines.push(
      `${meta.missingRequirementIds.length} requirements still appear uncovered in this structured snapshot — evaluators may score gaps.`,
    );
  } else if (meta.missingRequirementIds.length > 0) {
    driverLines.push(
      "Some requirements remain uncovered — strengthen explicit hooks to the evaluation criteria.",
    );
  }

  if (meta.riskFlags.length > 2) {
    driverLines.push(
      `${meta.riskFlags.length} risk flags (e.g. length or discipline) — review before submission.`,
    );
  } else if (meta.riskFlags.length > 0) {
    driverLines.push(
      "Risk flags are present — usually page budget or claim discipline; confirm they are addressed.",
    );
  }

  if (driverLines.length === 0) {
    if (strength === "Strong") {
      driverLines.push(
        "Metadata shows few structural warnings — still verify every fact against the RFP and your interview story.",
      );
    } else {
      driverLines.push(
        "Strength is moderate — small gaps remain; use requirement coverage and constraint risk to prioritize fixes.",
      );
    }
  }

  return { strength, driverLines, sectionLens, evaluatorTips };
}

export type DraftSectionHealth = "on_track" | "mixed" | "at_risk";

export type DraftSectionHealthSnapshot = {
  health: DraftSectionHealth;
  headline: string;
  subline: string;
};

/** Single at-a-glance read across coverage, scoring, and constraints (heuristic, metadata-bound). */
export function draftSectionHealthSnapshot(input: {
  sectionType: DraftSectionType;
  metadata: DraftMetadata | null;
  bundle: GroundingBundlePayload | null;
  metricsMayBeStale: boolean;
}): DraftSectionHealthSnapshot {
  const { sectionType, metadata, bundle, metricsMayBeStale } = input;
  const maxPages = SECTION_FOCUS[sectionType].maxPages;

  if (!metadata) {
    return {
      health: "at_risk",
      headline: "Not assessable yet",
      subline:
        "Generate or save a version so requirement coverage, score strength, and constraint risk can reflect this draft.",
    };
  }

  if (metricsMayBeStale) {
    return {
      health: "mixed",
      headline: "Feedback may lag edits",
      subline:
        "Word count or text changed since the last structured save — treat coverage and flags as directional until you save or regenerate.",
    };
  }

  const guidance = buildConstraintGuidance({
    sectionType,
    meta: metadata,
    maxPages,
    bundle,
  });
  const critical = guidance.filter((g) => g.severity === "critical").length;
  const cov = coverageHealth(
    metadata,
    bundle?.requirements.length ?? 0,
    bundle,
  );
  const str = scoringStrength(sectionType, metadata, bundle);

  if (critical > 0 || str === "Weak" || cov === "weak") {
    const biggest =
      critical > 0
        ? "Address critical constraint risk first (page budget or unsupported claims)."
        : str === "Weak"
          ? "Strengthen requirement coverage and claim discipline before review."
          : "Close requirement coverage gaps and strengthen grounding-bundle support before treating this as final.";
    return {
      health: "at_risk",
      headline: "Needs focused edits",
      subline: biggest,
    };
  }

  if (str === "Moderate" || cov === "partial" || guidance.length > 0) {
    return {
      health: "mixed",
      headline: "Usable with gaps",
      subline:
        "No critical blockers in metadata — tighten remaining gaps in requirement coverage and constraint risk before approval.",
    };
  }

  return {
    health: "on_track",
    headline: "In good structural shape",
    subline:
      "Metadata shows aligned requirement coverage and few warnings — still validate facts and evaluator narrative manually.",
  };
}

export type DraftFeedbackAction = {
  priority: number;
  title: string;
  detail: string;
};

/** Prioritized next steps from current metadata, bundle, and section (brief, actionable). */
export function draftFeedbackNextSteps(input: {
  sectionType: DraftSectionType;
  metadata: DraftMetadata | null;
  bundle: GroundingBundlePayload | null;
  metricsMayBeStale: boolean;
}): DraftFeedbackAction[] {
  const { sectionType, metadata, bundle, metricsMayBeStale } = input;
  const actions: DraftFeedbackAction[] = [];

  if (!metadata) {
    actions.push({
      priority: 1,
      title: "Generate or save a draft",
      detail: "Structured feedback depends on metadata from generation or a saved version.",
    });
    return actions;
  }

  if (metricsMayBeStale) {
    actions.push({
      priority: 2,
      title: "Save or regenerate to refresh metrics",
      detail:
        "Edits are not fully reflected in coverage counts — save a new version or run generation after substantive changes.",
    });
  }

  if (metadata.unsupportedClaimFlags.length > 0) {
    actions.push({
      priority: 3,
      title: "Resolve unsupported claims",
      detail:
        "Qualify, cite bundle evidence, or remove statements flagged as unsupported before approval.",
    });
  }

  const max = SECTION_FOCUS[sectionType].maxPages;
  const pageR = pageOverflowRisk(metadata.estimatedPages, max);
  if (pageR === "over") {
    actions.push({
      priority: 4,
      title: "Bring volume inside page budget",
      detail: `Estimated ~${metadata.estimatedPages} pages vs ${max} max — condense or restructure.`,
    });
  } else if (pageR === "near") {
    actions.push({
      priority: 7,
      title: "Tighten for page headroom",
      detail: "You are close to the cap — remove redundancy so scored content survives editing.",
    });
  }

  if (metadata.missingRequirementIds.length > 0) {
    const n = metadata.missingRequirementIds.length;
    if (sectionType === "Experience") {
      actions.push({
        priority: 5,
        title: "Add metrics and proof hooks",
        detail: `${n} requirement(s) still uncovered — tie narrative to quantified outcomes and references.`,
      });
    } else if (sectionType === "Solution") {
      actions.push({
        priority: 5,
        title: "Map narrative to scored requirements",
        detail: `${n} gap(s) — make criterion fit explicit; reduce ornamental technical depth.`,
      });
    } else if (sectionType === "Risk") {
      actions.push({
        priority: 5,
        title: "Complete risk–mitigation coverage",
        detail: `${n} requirement(s) uncovered — add mitigation, owner, and evidence for each material risk.`,
      });
    } else if (sectionType === "Interview") {
      actions.push({
        priority: 5,
        title: "Close oral–written alignment gaps",
        detail: `${n} requirement hook(s) missing — Interview answers should trace to the same scored scope as Solution and Risk.`,
      });
    } else {
      actions.push({
        priority: 5,
        title: "Close requirement coverage gaps",
        detail: `${n} requirement(s) appear missing — align text with bundle scope before review.`,
      });
    }
  }

  if (bundle) {
    const stats = getGroundingBundleStats(bundle);
    if (stats.evidenceCount === 0 && stats.requirementCount > 0) {
      actions.push({
        priority: 6,
        title: "Strengthen the grounding bundle",
        detail:
          "Add evidence rows to the grounding bundle before regenerating — output stays thin without proof objects.",
      });
    } else if (stats.gapCount >= 2) {
      actions.push({
        priority: 8,
        title: "Address bundle gaps",
        detail: `${stats.gapCount} gaps recorded — enrich requirements or evidence, then regenerate if needed.`,
      });
    }
    const sup = bundle.requirementSupport;
    if (sup && bundle.requirements.length > 0) {
      const noneN = bundle.requirements.filter((r) => {
        const s = sup[r.id];
        return !s || s.level === "none";
      }).length;
      if (noneN > 0) {
        actions.push({
          priority: 6,
          title: "Build the proof graph",
          detail: `${noneN} requirement(s) have no linked proof — attach evidence in the matrix, then run build proof graph (API) so feedback uses traceable support.`,
        });
      }
    }
  }

  const seen = new Set<string>();
  let out = actions
    .filter((a) => {
      if (seen.has(a.title)) return false;
      seen.add(a.title);
      return true;
    })
    .sort((a, b) => a.priority - b.priority);

  const manual: DraftFeedbackAction = {
    priority: 99,
    title: "Manual compliance pass",
    detail:
      "Cross-check the live RFP, pricing workbook, and oral defense — metadata does not replace human review.",
  };
  if (!seen.has(manual.title) && out.length < 5) {
    out = [...out, manual];
  }

  return out.slice(0, 5);
}

/** Counts and gap tally for grounding bundle summaries (UI + validation). */
export type GroundingBundleStats = {
  requirementCount: number;
  evidenceCount: number;
  vendorFactCount: number;
  chunkCount: number;
  gapCount: number;
  architectureOptionCount: number;
  validationNoteCount: number;
  /** requirements + evidence + facts + chunks */
  groundingItemTotal: number;
  /** Includes architecture options (for “anything to ground on?” checks). */
  substantiveTotal: number;
};

export function getGroundingBundleStats(
  payload: GroundingBundlePayload,
): GroundingBundleStats {
  const requirementCount = payload.requirements.length;
  const evidenceCount = payload.evidence.length;
  const vendorFactCount = payload.vendorFacts.length;
  const chunkCount = payload.retrievedChunks.length;
  const gapCount = payload.gaps.length;
  const architectureOptionCount = payload.architectureOptions.length;
  const validationNoteCount = payload.validationNotes.length;
  const vi = payload.vendorIntelligence;
  const viCount = vi
    ? vi.fitDimensions.length +
      vi.vendorClaims.length +
      vi.intelligenceFacts.length +
      vi.interviewQuestions.length +
      vi.integrationRequirements.length
    : 0;
  const ccCount = payload.competitorComparisonContext ? 1 : 0;
  const paCount = payload.proposalAdaptation ? 1 : 0;
  const groundingItemTotal =
    requirementCount +
    evidenceCount +
    vendorFactCount +
    chunkCount +
    viCount +
    ccCount +
    paCount;
  return {
    requirementCount,
    evidenceCount,
    vendorFactCount,
    chunkCount,
    gapCount,
    architectureOptionCount,
    validationNoteCount,
    groundingItemTotal,
    substantiveTotal: groundingItemTotal + architectureOptionCount,
  };
}

export type BundleQualityLabel = "Strong" | "Moderate" | "Weak";

export type BundleQualityAssessment = {
  label: BundleQualityLabel;
  /** Short lines explaining the label (for tooltips and review panels). */
  reasons: string[];
};

/**
 * Heuristic bundle strength from payload shape only (no model calls).
 * Strong = sufficient grounding density and no recorded gaps.
 */
export function assessGroundingBundleQuality(
  payload: GroundingBundlePayload,
): BundleQualityAssessment {
  const s = getGroundingBundleStats(payload);
  const reasons: string[] = [];

  if (s.substantiveTotal === 0) {
    return {
      label: "Weak",
      reasons: ["No requirements, evidence, facts, or retrieval chunks in this bundle."],
    };
  }

  if (s.requirementCount === 0) {
    reasons.push("No requirements listed — scope may be unclear to the model.");
  }
  if (s.evidenceCount === 0) {
    reasons.push("No evidence items — citations and proof paths will be thin.");
  }
  if (s.chunkCount === 0) {
    reasons.push("No retrieval chunks — less source-linked context for drafting.");
  }
  if (s.gapCount > 0) {
    reasons.push(
      s.gapCount === 1
        ? "One open gap or missing-support note is recorded."
        : `${s.gapCount} open gaps or missing-support notes are recorded.`,
    );
  }
  if (s.validationNoteCount > 0) {
    reasons.push(
      `${s.validationNoteCount} validation note(s) — review before relying on claims.`,
    );
  }

  let proofGap = false;
  if (payload.requirementSupport && payload.requirements.length > 0) {
    const noneN = payload.requirements.filter((r) => {
      const e = payload.requirementSupport![r.id];
      return !e || e.level === "none";
    }).length;
    if (noneN > 0) {
      reasons.push(
        `${noneN} requirement(s) have no proof-graph evidence — link evidence and run build proof graph.`,
      );
      proofGap = true;
    }
  }

  const hasCore =
    s.requirementCount >= 1 &&
    s.evidenceCount >= 1 &&
    (s.chunkCount >= 1 || s.vendorFactCount >= 1);

  if (
    s.gapCount === 0 &&
    hasCore &&
    s.validationNoteCount === 0 &&
    !proofGap
  ) {
    return {
      label: "Strong",
      reasons: [
        "Requirements, evidence, and source context are present with no recorded gaps.",
      ],
    };
  }

  if (s.substantiveTotal >= 2 && reasons.length <= 2) {
    return {
      label: "Moderate",
      reasons:
        reasons.length > 0
          ? reasons
          : ["Grounding is usable but not complete — review gaps before final volume."],
    };
  }

  return {
    label: "Weak",
    reasons:
      reasons.length > 0
        ? reasons
        : ["Bundle is thin or uneven — strengthen evidence and requirements before final text."],
  };
}

export type BundleGenerationReadiness = {
  canGenerate: boolean;
  /** Hard block: empty / unusable bundle. */
  blockReason?: string;
  /** Soft issues: generation allowed but user should read. */
  warnings: string[];
  quality: BundleQualityAssessment;
};

/**
 * Pre-flight for draft generation from a grounding bundle.
 * Blocks only when there is nothing substantive to ground on.
 */
export function getBundleGenerationReadiness(
  payload: GroundingBundlePayload,
): BundleGenerationReadiness {
  const stats = getGroundingBundleStats(payload);
  const quality = assessGroundingBundleQuality(payload);
  const warnings: string[] = [];

  if (!payload.rfp?.core?.solicitationNumber?.trim()) {
    return {
      canGenerate: false,
      blockReason:
        "Structured RFP grounding is missing from this bundle. Rebuild the grounding bundle so solicitation weights and requirements are attached.",
      warnings: [],
      quality,
    };
  }

  if (payload.rfp.stub) {
    warnings.push(
      "Structured RFP is a stub — canonical solicitation weights may be missing; confirm before final volumes.",
    );
  }

  if (!payload.contract?.term) {
    return {
      canGenerate: false,
      blockReason:
        "SRV-1 contract grounding is missing from this bundle. Rebuild the grounding bundle so scope, performance, and pricing discipline are attached.",
      warnings: [],
      quality,
    };
  }

  if (payload.contract.stub) {
    warnings.push(
      "SRV-1 contract structure is a stub — enforceable obligations may be incomplete until canonical contract data is registered.",
    );
  }

  if (stats.substantiveTotal === 0) {
    return {
      canGenerate: false,
      blockReason:
        "This grounding bundle has no substantive content (requirements, evidence, facts, retrieval chunks, or architecture context). Build or select a richer bundle before generating.",
      warnings: [],
      quality,
    };
  }

  if (stats.requirementCount === 0 && stats.evidenceCount === 0) {
    warnings.push(
      "No requirements and no evidence — only facts, chunks, or architecture context are present. Output may be thin; prefer a bundle with explicit scope and proof.",
    );
  }

  if (stats.evidenceCount === 0) {
    warnings.push(
      "No evidence items in this bundle — generated text may lack explicit proof hooks.",
    );
  }

  if (stats.gapCount > 0) {
    warnings.push(
      stats.gapCount === 1
        ? "One recorded gap remains — expect the draft to flag or soften that area."
        : `${stats.gapCount} recorded gaps — review unresolved support before submission.`,
    );
  }

  if (stats.chunkCount === 0) {
    warnings.push(
      "No embedded retrieval chunks — grounding relies on structured fields only.",
    );
  }

  if (stats.validationNoteCount > 0) {
    warnings.push(
      "Validation notes are present — treat claims as provisional until cleared.",
    );
  }

  if (payload.requirementSupport && payload.requirements.length > 0) {
    const noneN = payload.requirements.filter((r) => {
      const e = payload.requirementSupport![r.id];
      return !e || e.level === "none";
    }).length;
    if (noneN > 0) {
      warnings.push(
        `${noneN} requirement(s) lack proof-graph rows — generated text may over- or under-claim versus traceable evidence.`,
      );
    }
  }

  if (quality.label === "Weak") {
    warnings.push(
      `Overall bundle strength: Weak — ${quality.reasons[0] ?? "review contents before relying on output."}`,
    );
  } else if (quality.label === "Moderate" && stats.gapCount === 0) {
    warnings.push(
      "Overall bundle strength: Moderate — usable for a first draft; consider more evidence or retrieval.",
    );
  }

  const pr = payload.pricing;
  if (pr && !pr.ready) {
    warnings.push(
      "Structured pricing is incomplete or not contract-aligned — Solution/Risk/Executive drafts should avoid firm price totals until the workbook validates.",
    );
  }

  return {
    canGenerate: true,
    warnings,
    quality,
  };
}

/** Support expectations string for generator UI and prompts (server mirrors in constants). */
export function sectionSupportExpectation(sectionType: DraftSectionType): string {
  return SECTION_SUPPORT_EXPECTATIONS[sectionType];
}

export type GenerationRunKind = "fresh" | "regenerate_full" | "regenerate_paragraph";

export type SectionGenerationMode = {
  id: string;
  label: string;
  hint: string;
  requiresEditorContent: boolean;
  runKind: GenerationRunKind;
  /** Always sent to the model as strategic discipline (may be combined with regen instructions). */
  strategicDirective: string;
  /** Instruction line for regeneration scopes (full / paragraph). */
  regenInstruction?: string;
};

function genMode(input: SectionGenerationMode): SectionGenerationMode {
  return input;
}

/**
 * Section-aware generation strategies — deliberate, small set per volume type.
 */
export function sectionGenerationModes(
  sectionType: DraftSectionType,
): SectionGenerationMode[] {
  const full = genMode({
    id: "full_section",
    label: "Generate full section",
    hint: "First draft from the grounding bundle only.",
    requiresEditorContent: false,
    runKind: "fresh",
    strategicDirective: `Write a complete ${sectionType} section from the attached grounding. Satisfy the page budget, map claims to requirements and evidence, and make unsupported areas explicit rather than inventing proof.`,
  });

  const regen = genMode({
    id: "regenerate_section",
    label: "Regenerate from editor",
    hint: "Rewrite using grounding; current text informs structure only.",
    requiresEditorContent: true,
    runKind: "regenerate_full",
    strategicDirective:
      "Rewrite the section from grounding. Treat existing draft as non-authoritative for facts — only retain structure or emphasis the user may want; do not carry forward uncited claims.",
    regenInstruction:
      "Full rewrite: align tightly to scoring criteria, remove redundancy, and preserve only grounded facts.",
  });

  if (sectionType === "Experience") {
    return [
      full,
      regen,
      genMode({
        id: "strengthen_metrics",
        label: "Strengthen metrics emphasis",
        hint: "More quantified proof and outcome density.",
        requiresEditorContent: true,
        runKind: "regenerate_full",
        strategicDirective:
          "Experience evaluators weight measurable outcomes. Increase metrics, baselines, and traceability to evidence without inventing numbers.",
        regenInstruction:
          "Elevate quantified outcomes and reliability proof. Each performance claim should tie to evidence or be qualified. Remove generic superlatives.",
      }),
      genMode({
        id: "sharpen_proof",
        label: "Sharpen proof / reliability",
        hint: "Tighter evidence linkage and reference discipline.",
        requiresEditorContent: true,
        runKind: "regenerate_full",
        strategicDirective:
          "Stress test claims against evidence: name the proof path (reference, artifact, or metric) or soften the claim.",
        regenInstruction:
          "Tighten how each claim is proven — references, artifacts, or metrics. Flag residual gaps in unsupported_claim_flags where proof is thin.",
      }),
      genMode({
        id: "refine_opening",
        label: "Refine opening only",
        hint: "First paragraph — clarity and hook.",
        requiresEditorContent: true,
        runKind: "regenerate_paragraph",
        strategicDirective:
          "Opening must state scope and value proposition with zero uncited assertions.",
        regenInstruction:
          "Rewrite only the opening paragraph: clear scope, evaluator-neutral tone, and explicit tie to requirements from grounding.",
      }),
    ];
  }

  if (sectionType === "Solution") {
    return [
      full,
      regen,
      genMode({
        id: "improve_clarity",
        label: "Improve clarity",
        hint: "Non-technical readability for evaluators.",
        requiresEditorContent: true,
        runKind: "regenerate_full",
        strategicDirective:
          "Solution scoring rewards clarity over depth. Prefer plain-language value and criterion mapping.",
        regenInstruction:
          "Improve non-technical clarity: shorter sentences, explicit links to evaluation criteria, remove jargon without defined benefit.",
      }),
      genMode({
        id: "reduce_technical_density",
        label: "Reduce technical density",
        hint: "Less stack detail; more operational meaning.",
        requiresEditorContent: true,
        runKind: "regenerate_full",
        strategicDirective:
          "Reduce stack-centric detail unless each technical point maps to a scored requirement.",
        regenInstruction:
          "Strip or relocate deep technical detail; keep integration story and outcomes evaluators can score.",
      }),
      genMode({
        id: "tighten_pages",
        label: "Tighten for page limit",
        hint: "Condense without losing scored coverage.",
        requiresEditorContent: true,
        runKind: "regenerate_full",
        strategicDirective:
          `Respect the section page cap strictly; prioritize scored content over narrative flourish.`,
        regenInstruction:
          "Condense prose to fit the page budget; merge redundant points; keep requirement coverage explicit.",
      }),
      genMode({
        id: "refine_opening",
        label: "Refine opening only",
        hint: "Lead with evaluation alignment.",
        requiresEditorContent: true,
        runKind: "regenerate_paragraph",
        strategicDirective:
          "Lead with how the solution satisfies the evaluation framework.",
        regenInstruction:
          "Rewrite the opening paragraph for evaluator clarity and criterion alignment using only grounded facts.",
      }),
      genMode({
        id: "pricing_justification",
        label: "Emphasize pricing justification",
        hint: "Map line items to services and value (from bundle pricing model).",
        requiresEditorContent: true,
        runKind: "regenerate_full",
        strategicDirective:
          "Use the structured pricing model in the grounding bundle to justify rates: tie each major cost bucket to RFP-required services (dispensing, delivery, packaging, billing, integration) without inventing numbers beyond the model.",
        regenInstruction:
          "Rewrite to foreground pricing discipline and service-line value using only totals and line items from STRUCTURED PRICING in the bundle.",
      }),
    ];
  }

  if (sectionType === "Risk") {
    return [
      full,
      regen,
      genMode({
        id: "strengthen_risk_framing",
        label: "Strengthen risk framing",
        hint: "Clear risk statements and evaluator realism.",
        requiresEditorContent: true,
        runKind: "regenerate_full",
        strategicDirective:
          "Risk volume must read as credible to technical evaluators: explicit risks, not generic disclaimers.",
        regenInstruction:
          "Sharpen risk statements: name the failure mode, impact, and detection; avoid boilerplate.",
      }),
      genMode({
        id: "strengthen_mitigation",
        label: "Strengthen mitigation structure",
        hint: "Mitigation + evidence path per risk.",
        requiresEditorContent: true,
        runKind: "regenerate_full",
        strategicDirective:
          "Each material risk needs mitigation, residual posture, and trace to evidence or an honest gap.",
        regenInstruction:
          "Restructure so each risk has mitigation, owner, timeline, and proof or flagged gap — interview-consistent.",
      }),
      genMode({
        id: "cost_risk",
        label: "Surface cost / margin risk",
        hint: "Delivery, labor, drug cost, integration — grounded to pricing model.",
        requiresEditorContent: true,
        runKind: "regenerate_full",
        strategicDirective:
          "Address cost and margin exposure using the bundle’s structured pricing: where variability exists (volume, delivery intensity, staffing), state the risk and mitigation without inventing figures outside the pricing model.",
        regenInstruction:
          "Add or sharpen material cost risks tied to annual vs contract totals and service lines from STRUCTURED PRICING; keep interview-defensible.",
      }),
      genMode({
        id: "tighten_pages",
        label: "Tighten for page limit",
        hint: "Shorter risk register narrative.",
        requiresEditorContent: true,
        runKind: "regenerate_full",
        strategicDirective:
          "Fit risk narrative within page cap; tables or bullets where they aid scannability.",
        regenInstruction:
          "Condense while preserving risk–mitigation pairs and evidence links.",
      }),
      genMode({
        id: "refine_opening",
        label: "Refine opening only",
        hint: "Frame overall risk posture.",
        requiresEditorContent: true,
        runKind: "regenerate_paragraph",
        strategicDirective:
          "Opening summarizes risk posture without downplaying material issues.",
        regenInstruction:
          "Rewrite opening paragraph: balanced risk posture, grounded in bundle facts.",
      }),
    ];
  }

  if (sectionType === "Interview") {
    return [
      full,
      regen,
      genMode({
        id: "oral_volume_alignment",
        label: "Align to Solution + Risk volumes",
        hint: "Same facts as written sections; no drift under oral scoring.",
        requiresEditorContent: true,
        runKind: "regenerate_full",
        strategicDirective:
          "Interview section must not contradict Solution or Risk; rehearse operational story with grounding-only facts.",
        regenInstruction:
          "Rewrite so every major claim maps to the same proof and themes as Solution/Risk — flag gaps honestly.",
      }),
      genMode({
        id: "pricing_oral_defense",
        label: "Pricing & cost Q&A posture",
        hint: "Defend integrated model without sounding defensive.",
        requiresEditorContent: true,
        runKind: "regenerate_full",
        strategicDirective:
          "Defend structured pricing using bundle JSON only; explain emergency delivery, Medicaid billing, and integration as integrated — not add-ons.",
        regenInstruction:
          "Refocus on cost stability, transparency, and RFP/contract alignment; no new dollar figures beyond structured pricing.",
      }),
      genMode({
        id: "tighten_pages",
        label: "Tighten for page limit",
        hint: "Two-page oral script discipline.",
        requiresEditorContent: true,
        runKind: "regenerate_full",
        strategicDirective:
          "Fit oral-defense narrative within page cap; prioritize evaluator hot buttons: 24/7, emergency delivery, MatrixCare, billing, risk.",
        regenInstruction:
          "Condense while preserving Q&A-ready structure and pricing alignment.",
      }),
      genMode({
        id: "refine_opening",
        label: "Refine opening only",
        hint: "Set integrated-partner tone upfront.",
        requiresEditorContent: true,
        runKind: "regenerate_paragraph",
        strategicDirective:
          "Opening establishes single accountable partner and operational confidence — grounded only.",
        regenInstruction:
          "Rewrite opening paragraph for oral presentation clarity.",
      }),
    ];
  }

  if (sectionType === "Executive Summary") {
    return [
      full,
      regen,
      genMode({
        id: "improve_clarity",
        label: "Improve clarity",
        hint: "Tighter exec narrative.",
        requiresEditorContent: true,
        runKind: "regenerate_full",
        strategicDirective:
          "Executive summary must not introduce facts absent from scored volumes.",
        regenInstruction:
          "Tighten executive narrative: mirror volumes, remove novelty claims, improve flow.",
      }),
      genMode({
        id: "tighten_pages",
        label: "Tighten for page limit",
        hint: "Single page discipline.",
        requiresEditorContent: true,
        runKind: "regenerate_full",
        strategicDirective:
          "Strict one-page discipline: highest-value messages only.",
        regenInstruction:
          "Compress to fit one page; preserve only grounded, scored themes.",
      }),
      genMode({
        id: "interview_cost_defense",
        label: "Interview / cost defense framing",
        hint: "Oral defense: value, assumptions, and risk — from pricing model.",
        requiresEditorContent: true,
        runKind: "regenerate_full",
        strategicDirective:
          "Frame executive narrative so an evaluator can defend cost and value in interview: reference annual and contract totals and major line items from structured pricing only; flag gaps honestly.",
        regenInstruction:
          "Refocus executive summary for oral defense: 2–3 crisp cost/value themes tied to STRUCTURED PRICING; no new numbers.",
      }),
    ];
  }

  /* Architecture Narrative */
  return [
    full,
    regen,
    genMode({
      id: "improve_clarity",
      label: "Improve clarity",
      hint: "Integration story for evaluators.",
      requiresEditorContent: true,
      runKind: "regenerate_full",
      strategicDirective:
        "Architecture narrative must clarify roles, boundaries, and orchestration — consistent with Solution/Risk.",
      regenInstruction:
        "Clarify integration and partner boundaries; reduce opaque component lists.",
    }),
    genMode({
      id: "tighten_pages",
      label: "Tighten for page limit",
      hint: "Shorter architecture story.",
      requiresEditorContent: true,
      runKind: "regenerate_full",
      strategicDirective:
        "Respect page cap; prioritize integration clarity over exhaustive component naming.",
      regenInstruction:
        "Condense architecture prose while keeping Malone orchestration and partner roles explicit.",
    }),
    genMode({
      id: "refine_opening",
      label: "Refine opening only",
      hint: "Set integration context upfront.",
      requiresEditorContent: true,
      runKind: "regenerate_paragraph",
      strategicDirective:
        "Opening frames the architecture in business and operational terms.",
      regenInstruction:
        "Rewrite opening paragraph: business context, then technical boundaries — grounded only.",
    }),
  ];
}

/** Oldest → newest within a section. */
export function versionsChronological(versions: DraftVersion[]): DraftVersion[] {
  return [...versions].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
  );
}

/** 1-based index of a version in section history (by createdAt). */
export function versionOrdinal(
  sectionVersions: DraftVersion[],
  versionId: string,
): number | null {
  const asc = versionsChronological(sectionVersions);
  const i = asc.findIndex((v) => v.id === versionId);
  return i === -1 ? null : i + 1;
}

/** One-line summary for version list rows. */
export function formatVersionMetadataSummary(metadata: DraftMetadata): string {
  const parts = [
    `~${metadata.estimatedPages} pp`,
    `${metadata.requirementCoverageIds.length} covered`,
    `${metadata.missingRequirementIds.length} missing`,
  ];
  if (metadata.generationMode) {
    const gm = metadata.generationMode;
    parts.push(gm.length > 28 ? `${gm.slice(0, 26)}…` : gm);
  }
  return parts.join(" · ");
}
