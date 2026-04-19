import type {
  CompetitorAwareSimulationResult,
  StrategicNarrativeSpine,
  VendorDecisionSynthesis,
} from "@/types";

function isoNow(): string {
  return new Date().toISOString();
}

function leadVendorName(
  synthesis: VendorDecisionSynthesis | null | undefined,
  sim: CompetitorAwareSimulationResult | null | undefined,
): string | undefined {
  const id = synthesis?.recommendedVendorId ?? sim?.recommendedVendorId;
  if (!id || !sim?.entries?.length) return undefined;
  return sim.entries.find((e) => e.vendorId === id)?.vendorName;
}

/**
 * Builds the canonical strategic spine from decision synthesis and competitor context.
 * Safe to call with partial data — lowers evidence confidence when sparse.
 */
export function buildStrategicNarrativeSpine(input: {
  projectId: string;
  synthesis: VendorDecisionSynthesis | null | undefined;
  sim?: CompetitorAwareSimulationResult | null;
  recommendedVendorDisplayName?: string;
  architectureOptionName?: string;
}): StrategicNarrativeSpine {
  const { synthesis, sim } = input;
  const vendorName =
    input.recommendedVendorDisplayName?.trim() ||
    leadVendorName(synthesis ?? null, sim ?? null) ||
    "the recommended vendor";

  const arch = input.architectureOptionName?.trim();

  const evidenceConfidence: StrategicNarrativeSpine["evidenceConfidence"] =
    !synthesis
      ? "low"
      : synthesis.confidence === "high"
        ? "high"
        : synthesis.confidence === "medium"
          ? "medium"
          : "low";

  const coreParts: string[] = [];
  if (arch) coreParts.push(`${arch}`);
  coreParts.push(`${vendorName} is the evidence-backed lead for this solicitation`);
  if (synthesis?.recommendationType === "multi_vendor_stack") {
    coreParts.push("using a multi-vendor stack with explicit Malone governance and handoff clarity");
  }
  if (synthesis) {
    coreParts.push(
      `with ${synthesis.pricingAssessment} pricing posture, ${synthesis.roleFitAssessment} role ownership, and ${synthesis.failureResilience} operational resilience (synthesis confidence ${synthesis.confidence}).`,
    );
  } else {
    coreParts.push(
      "— complete decision synthesis when competitor comparison and intelligence are available.",
    );
  }

  const whyThisWins = synthesis
    ? [...synthesis.keyStrengths.slice(0, 6)]
    : [
        "Structured competitor comparison and vendor intelligence still loading — anchor claims to sourced rows only.",
      ];

  const strongestSupportedClaims = synthesis
    ? synthesis.keyStrengths.slice(0, 5).map((s) => `Evidence-weighted strength: ${s}`)
    : ["Fit dimensions, claims, and facts as stored in vendor intelligence (no new facts in prose)."];

  const claimsToAvoidOrQualify: string[] = [
    "Absolute “seamless” or “fully integrated” phrasing where handoffs or middleware exist.",
    "Direct sole ownership of MatrixCare / EHR integration if role-fit shows shared or Malone-led accountability.",
    "Lowest-price leadership if pricing reality flags hidden cost, underpricing, or Malone workload gaps.",
    ...((synthesis?.keyWeaknesses ?? []).slice(0, 4).map((w) => `Qualify or narrow: ${w}`)),
  ];

  if (synthesis?.maloneDependency === "high" || synthesis?.roleFitAssessment === "fragile") {
    claimsToAvoidOrQualify.push(
      "Vendor-only end-to-end ownership language — split RACI with Malone and DHS where role-fit shows dependency.",
    );
  }

  const roleOwnershipStory = synthesis
    ? [
        `Role posture: ${synthesis.roleFitAssessment.replace(/_/g, " ")} — align Solution/Risk RACI with vendor role-fit records.`,
        synthesis.maloneDependency !== "low"
          ? `Malone dependency is ${synthesis.maloneDependency}: state orchestration, escalation, and unpriced Malone work explicitly.`
          : "Malone dependency is low for the lead posture — still document governance touchpoints.",
      ]
    : ["Clarify vendor vs Malone vs DHS ownership for dispensing, EHR, billing, and emergency logistics."];

  const pricingStory = synthesis
    ? [
        `Pricing realism: ${synthesis.pricingAssessment} — ${(synthesis.decisionRationale.split(".")[0] ?? synthesis.decisionRationale).trim()}.`,
        `Mitigation posture: ${synthesis.mitigationPosture}; avoid celebrating headline price without lifecycle and exclusion clarity.`,
      ]
    : ["Align price sheet, exclusions, and change-order posture with structured pricing validation."];

  const riskStory = synthesis
    ? [
        `Top synthesized risks: ${synthesis.criticalRisks.slice(0, 3).join(" · ") || "(none listed)"}.`,
        `Failure resilience: ${synthesis.failureResilience} — Risk volume must echo critical failure paths, not only generic compliance.`,
      ]
    : ["Risk must reflect failure-mode simulation themes and pricing/integration stress paths."];

  const mitigationStory = synthesis
    ? [
        `Mitigation strength: ${synthesis.mitigationPosture}.`,
        ...synthesis.whatWouldChangeDecision.slice(0, 3).map((x) => `Negotiation / proof lever: ${x}`),
      ]
    : ["Tie mitigations to evidence rows and interview confirmations."];

  const interviewStory = synthesis
    ? [
        `Interview readiness: ${synthesis.interviewReadiness} — close P1 gaps before locking assertions.`,
        "Use interview volume for operational truth and escalation paths, not marketing repetition of Solution.",
      ]
    : ["Structured interview answers must support any scored claim repeated in Solution or Risk."];

  const mustAppearThemes = [
    vendorName,
    "Malone governance and orchestration",
    "Evidence-backed (sourced) vendor assertions",
    ...(arch ? [arch] : []),
  ];

  const mustNotContradictThemes = [
    "A different vendor as the sole recommended lead (unless explicitly comparing alternatives with context).",
    "Pricing certainty that contradicts pricing-reality hidden-cost or underpricing flags.",
    "Zero residual risk where failure simulation shows fragile or high_risk resilience.",
  ];

  const sensitiveThemes = [
    "MatrixCare / EHR integration boundaries",
    "Emergency delivery and logistics fragility",
    "Medicaid billing and payer coordination",
    "Malone-unpriced or shared-cost work",
  ];

  return {
    projectId: input.projectId,
    recommendedVendorId: synthesis?.recommendedVendorId ?? sim?.recommendedVendorId,
    recommendedVendorStackIds: synthesis?.recommendedVendorStackIds,
    corePosition: coreParts.join(" "),
    whyThisWins,
    strongestSupportedClaims,
    claimsToAvoidOrQualify,
    roleOwnershipStory,
    pricingStory,
    riskStory,
    mitigationStory,
    interviewStory,
    mustAppearThemes,
    mustNotContradictThemes,
    sensitiveThemes,
    evidenceConfidence,
    generatedFromDecisionSynthesisAt: synthesis?.updatedAt ?? isoNow(),
  };
}
