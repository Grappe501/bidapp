import type { BidReviewSnapshot } from "@/lib/review-rules-engine";
import type {
  DraftSectionType,
  NarrativeAlignmentResult,
  NarrativeMisalignment,
  NarrativeSectionKey,
  StrategicNarrativeSpine,
} from "@/types";

const SEV_ORDER = { low: 0, medium: 1, high: 2, critical: 3 };

function norm(s: string): string {
  return s.toLowerCase();
}

function hasAny(hay: string, pats: RegExp[]): boolean {
  return pats.some((p) => p.test(hay));
}

function vendorTokens(name: string): string[] {
  return name
    .split(/[\s,&]+/)
    .map((t) => t.trim())
    .filter((t) => t.length > 2)
    .map((t) => norm(t));
}

function scoreFromMisalignments(
  issues: NarrativeMisalignment[],
): Record<string, number> {
  const keys: NarrativeSectionKey[] = [
    "executive_summary",
    "solution",
    "risk",
    "interview",
    "client_review",
    "final_bundle",
    "architecture_narrative",
    "pricing_summary",
  ];
  const base: Record<string, number> = Object.fromEntries(keys.map((k) => [k, 100]));
  for (const m of issues) {
    const pen = (SEV_ORDER[m.severity] + 1) * 12;
    base[m.sectionKey] = Math.max(5, (base[m.sectionKey] ?? 100) - pen);
  }
  return base;
}

function mergeIssues(
  a: NarrativeMisalignment[],
  b: NarrativeMisalignment[],
): NarrativeMisalignment[] {
  const seen = new Set<string>();
  const out: NarrativeMisalignment[] = [];
  for (const m of [...a, ...b]) {
    const k = `${m.sectionKey}|${m.message.slice(0, 120)}`;
    if (seen.has(k)) continue;
    seen.add(k);
    out.push(m);
  }
  return out;
}

function overallFromIssues(issues: NarrativeMisalignment[]): NarrativeAlignmentResult["overallAlignment"] {
  if (issues.some((m) => m.severity === "critical")) return "misaligned";
  if (issues.some((m) => m.severity === "high")) return "drifting";
  if (issues.some((m) => m.severity === "medium")) return "acceptable";
  return "strong";
}

/**
 * Map draft sections to narrative keys (first section of each type wins for scoring).
 */
export function extractNarrativeSectionTextsFromSnapshot(
  snapshot: BidReviewSnapshot,
): Partial<Record<NarrativeSectionKey, string>> {
  const map: Partial<Record<DraftSectionType, string>> = {};
  for (const sec of snapshot.draftSections) {
    const v = snapshot.activeDraftBySection[sec.id];
    const c = v?.content?.trim() ?? "";
    if (!c) continue;
    if (!map[sec.sectionType]) map[sec.sectionType] = c;
    else map[sec.sectionType] = `${map[sec.sectionType]}\n\n${c}`;
  }
  const keyMap: Partial<Record<DraftSectionType, NarrativeSectionKey>> = {
    "Executive Summary": "executive_summary",
    Solution: "solution",
    Risk: "risk",
    Interview: "interview",
    "Architecture Narrative": "architecture_narrative",
  };
  const out: Partial<Record<NarrativeSectionKey, string>> = {};
  for (const t of Object.keys(keyMap) as DraftSectionType[]) {
    const nk = keyMap[t];
    if (nk && map[t]) out[nk] = map[t];
  }
  return out;
}

/**
 * Heuristic cross-section alignment vs the canonical spine — flags contradictions and omissions, not stylistic variety.
 */
export function evaluateNarrativeAlignment(input: {
  spine: StrategicNarrativeSpine;
  sectionTexts: Partial<Record<NarrativeSectionKey, string>>;
}): NarrativeAlignmentResult {
  const { spine } = input;
  const texts = input.sectionTexts;
  const issues: NarrativeMisalignment[] = [];

  const leadName =
    spine.mustAppearThemes.find((t) => !/malone|governance|evidence/i.test(t)) ??
    spine.recommendedVendorId ??
    "";
  const leadToks = leadName ? vendorTokens(leadName) : [];

  const checkSection = (
    key: NarrativeSectionKey,
    text: string | undefined,
    minLen: number,
  ) => {
    if (!text || text.trim().length < minLen) {
      issues.push({
        sectionKey: key,
        severity: text && text.trim().length > 0 ? "medium" : "high",
        category: "omission",
        message: `${key.replace(/_/g, " ")} has little or no body text — the strategic spine cannot be reflected.`,
        expectedTheme: spine.corePosition.slice(0, 160),
        observedTheme: text?.slice(0, 80),
        correctionGuidance: `Expand ${key.replace(/_/g, " ")} so it states the lead vendor story, Malone governance, and evidence discipline from the spine.`,
      });
    }
  };

  checkSection("executive_summary", texts.executive_summary, 120);
  checkSection("solution", texts.solution, 200);
  checkSection("risk", texts.risk, 150);
  checkSection("interview", texts.interview, 100);

  const exec = texts.executive_summary ?? "";
  const sol = texts.solution ?? "";
  const risk = texts.risk ?? "";
  const iv = texts.interview ?? "";
  const arch = texts.architecture_narrative ?? "";
  const price = texts.pricing_summary ?? "";

  if (leadToks.length > 0 && exec.length > 80) {
    const hit = leadToks.some((t) => norm(exec).includes(t));
    if (!hit) {
      issues.push({
        sectionKey: "executive_summary",
        severity: "high",
        category: "vendor_conflict",
        message:
          "Executive Summary does not clearly name the evidence-backed lead vendor — readers may miss the decision spine.",
        expectedTheme: `Name ${leadName} as the lead posture.`,
        observedTheme: exec.slice(0, 120),
        correctionGuidance: `Add an explicit executive line naming ${leadName} and the architecture context without adding new uncited facts.`,
      });
    }
  }

  if (leadToks.length > 0 && sol.length > 120) {
    const hit = leadToks.some((t) => norm(sol).includes(t));
    if (!hit) {
      issues.push({
        sectionKey: "solution",
        severity: "high",
        category: "vendor_conflict",
        message: "Solution volume does not surface the recommended vendor as the operational lead — misaligned with competitor synthesis.",
        expectedTheme: `Center ${leadName} in the solution story with RACI clarity.`,
        correctionGuidance: `Tie Solution threads to ${leadName} and Malone orchestration; avoid implying a different vendor leads delivery.`,
      });
    }
  }

  const overstatePats = [
    /\bseamless\b/i,
    /\bfully integrated\b/i,
    /\bdirect matrixcare\b/i,
    /\bsole(?:\s+source)?\s+integration\b/i,
  ];
  const qualifyPats = [/malone/i, /\bshared\b/i, /\bmiddleware\b/i, /\bcoordinat/i, /\braci\b/i];

  for (const [label, body] of [
    ["executive_summary", exec],
    ["solution", sol],
  ] as const) {
    if (body.length < 40) continue;
    if (
      hasAny(body, overstatePats) &&
      spine.sensitiveThemes.some((t) => /matrixcare|ehr|integration/i.test(t)) &&
      !hasAny(body, qualifyPats) &&
      (spine.evidenceConfidence === "low" || spine.claimsToAvoidOrQualify.some((c) => /matrixcare|ehr/i.test(c)))
    ) {
      issues.push({
        sectionKey: label as NarrativeSectionKey,
        severity: spine.evidenceConfidence === "low" ? "critical" : "high",
        category: "role_conflict",
        message:
          "Integration language sounds absolute or single-threaded while the spine requires shared / Malone-aware accountability.",
        expectedTheme: spine.roleOwnershipStory.join(" "),
        observedTheme: body.slice(0, 140),
        correctionGuidance:
          "Qualify MatrixCare / EHR language to reflect shared ownership, middleware, and Malone escalation — match role-fit and claim validation.",
      });
    }
  }

  const priceRisky =
    spine.pricingStory.some((p) => /risky|uncertain|hidden|underpric/i.test(p)) ||
    spine.claimsToAvoidOrQualify.some((c) => /lowest|price|cost/i.test(c));
  if (priceRisky && exec.length > 60) {
    if (/\blowest\b|\bcheapest\b|\bmost competitive price\b/i.test(exec) && !/qualif|caveat|lifecycle|exclusion|change order/i.test(exec)) {
      issues.push({
        sectionKey: "executive_summary",
        severity: "high",
        category: "pricing_conflict",
        message:
          "Executive cost language may overstate certainty while pricing reality flags risk or exclusions.",
        expectedTheme: spine.pricingStory.join(" "),
        correctionGuidance:
          "Add cost stability and exclusion language — align with pricing reality (hidden cost / underpricing risk) without inventing numbers.",
      });
    }
  }

  if (
    risk.length > 120 &&
    spine.evidenceConfidence !== "high" &&
    !hasAny(risk, [/mitigation|residual|escalat|failure|scenario|recover/i])
  ) {
    issues.push({
      sectionKey: "risk",
      severity: "medium",
      category: "omission",
      message:
        "Risk volume may under-specify mitigation / failure paths relative to the spine’s stress-test posture.",
      expectedTheme: spine.riskStory.slice(0, 2).join(" · "),
      correctionGuidance:
        "Bring explicit failure-mode, recovery, and escalation themes into Risk — same story as synthesis, more defensive tone than Executive Summary.",
    });
  }

  if (iv.length > 80 && leadToks.length > 0) {
    const hit = leadToks.some((t) => norm(iv).includes(t));
    if (!hit) {
      issues.push({
        sectionKey: "interview",
        severity: "medium",
        category: "vendor_conflict",
        message:
          "Interview prep does not clearly anchor on the recommended vendor — evaluators may see a different story than Solution.",
        expectedTheme: spine.interviewStory.join(" "),
        correctionGuidance: `Align interview prompts and defenses with ${leadName} and Malone escalation — operational tone, not repetition of marketing claims.`,
      });
    }
  }

  if (arch.length > 60 && leadToks.length > 0) {
    const hit = leadToks.some((t) => norm(arch).includes(t));
    if (!hit) {
      issues.push({
        sectionKey: "architecture_narrative",
        severity: "medium",
        category: "omission",
        message: "Architecture narrative does not name the lead vendor — stack story may drift from the decision spine.",
        expectedTheme: spine.mustAppearThemes.join(" · "),
        correctionGuidance:
          "Name vendor roles in the architecture option and tie handoffs to Malone governance — consistent with competitor recommendation.",
      });
    }
  }

  if (price.length > 40 && spine.pricingStory.some((p) => /risky|uncertain/i.test(p))) {
    if (!/exclusion|change order|assumption|lifecycle/i.test(norm(price))) {
      issues.push({
        sectionKey: "pricing_summary",
        severity: "low",
        category: "pricing_conflict",
        message:
          "Pricing summary narrative may understate caveats relative to pricing-risk signals in the spine.",
        expectedTheme: spine.pricingStory.join(" "),
        correctionGuidance:
          "Add explicit exclusions, assumptions, and change-order posture — align with pricing reality without flattening Risk.",
      });
    }
  }

  const client = texts.client_review ?? "";
  if (client.length > 40 && leadToks.length > 0) {
    const hit = leadToks.some((t) => norm(client).includes(t));
    if (!hit) {
      issues.push({
        sectionKey: "client_review",
        severity: "low",
        category: "vendor_conflict",
        message: "Client-facing summary line does not echo the named lead vendor.",
        expectedTheme: spine.corePosition.slice(0, 120),
        correctionGuidance: "Align client-facing one-pager language with the named lead vendor and Malone governance.",
      });
    }
  }

  const critical = issues.filter((i) => i.severity === "critical");
  const high = issues.filter((i) => i.severity === "high");
  const criticalMisalignments = mergeIssues(critical, high.slice(0, 6));
  const warnings = issues.filter((i) => i.severity === "medium" || i.severity === "low");

  const correctiveActions = Array.from(
    new Set(
      [...criticalMisalignments, ...warnings]
        .slice(0, 12)
        .map((m) => m.correctionGuidance),
    ),
  ).slice(0, 10);

  const overall = overallFromIssues(issues);

  return {
    overallAlignment: overall,
    sectionScores: scoreFromMisalignments(issues),
    criticalMisalignments,
    warnings,
    correctiveActions,
  };
}
