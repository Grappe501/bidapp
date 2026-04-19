import { formatCanonicalExecutiveSummaryForPrompt } from "../../data/canonical-executive-summary-s000000479";
import { formatCanonicalInterviewSectionForPrompt } from "../../data/canonical-interview-section-s000000479";
import {
  formatCanonicalRiskSectionForPrompt,
  S000000479_BID_NUMBER,
} from "../../data/canonical-risk-section-s000000479";
import { formatCanonicalSolutionSectionForPrompt } from "../../data/canonical-solution-section-s000000479";
import { formatPricingNarrativeMappingForPrompt } from "../../data/pricing-proposal-language-mapping";
import type { GroundingBundlePayload } from "../../types";
import { defaultParseModel, getOpenAI } from "./openai-client";
import type { DraftSectionType } from "../../types";
import {
  SECTION_STRATEGY,
  SECTION_SUPPORT_EXPECTATIONS,
  scoringForSectionType,
} from "../lib/drafting-constants";
import { getGroundingBundle } from "../repositories/grounding.repo";

export type DraftMetadata = {
  wordCount: number;
  estimatedPages: number;
  requirementCoverageIds: string[];
  missingRequirementIds: string[];
  riskFlags: string[];
  unsupportedClaimFlags: string[];
  generationMode?: string;
};

export type DraftingGenerationInput = {
  sectionType: DraftSectionType;
  /** When omitted, derived from sectionType + server constants */
  scoringBlocks?: {
    name: string;
    maxPoints: number;
    weight: number;
    description: string;
  }[];
  pageLimit: number;
  constraintRules: string;
  grounding: GroundingBundlePayload;
  tone?: string;
  regeneration?: {
    scope: "full" | "paragraph";
    instruction?: string;
    existingContent?: string;
    paragraphIndex?: number;
  };
  /** Optional; merged into user prompt for controlled modes (non-breaking). */
  strategicDirective?: string;
  /** Human-readable mode label for traceability in prompt only. */
  generationModeLabel?: string;
};

export type DraftingGenerationResult = {
  content: string;
  metadata: DraftMetadata;
};

const WORDS_PER_PAGE = 450;

function validateGrounding(grounding: GroundingBundlePayload): void {
  if (!grounding?.assembledAt) {
    throw new Error("Grounding bundle is required before drafting.");
  }
  if (!grounding.rfp?.core?.solicitationNumber?.trim()) {
    throw new Error(
      "Structured RFP grounding is required — rebuild the grounding bundle so drafting aligns to the solicitation.",
    );
  }
  if (
    !grounding.contract?.term ||
    typeof grounding.contract.term.baseYears !== "number" ||
    typeof grounding.contract.term.maxYears !== "number"
  ) {
    throw new Error(
      "Contract structure (SRV-1) grounding is required — rebuild the grounding bundle for enforceable proposal language.",
    );
  }
  const n =
    (grounding.requirements?.length ?? 0) +
    (grounding.evidence?.length ?? 0) +
    (grounding.retrievedChunks?.length ?? 0) +
    (grounding.vendorFacts?.length ?? 0) +
    (grounding.architectureOptions?.length ?? 0);
  if (n === 0) {
    throw new Error(
      "Grounding bundle is empty — add requirements, evidence, chunks, or facts.",
    );
  }
}

function firstNumber(...candidates: unknown[]): number | undefined {
  for (const c of candidates) {
    if (typeof c === "number" && !Number.isNaN(c)) return c;
  }
  return undefined;
}

function firstStringArray(...candidates: unknown[]): string[] {
  for (const c of candidates) {
    if (Array.isArray(c)) return c.map(String);
  }
  return [];
}

function normalizeMetadata(
  raw: Record<string, unknown>,
  content: string,
  pageLimit: number,
  allReqIds: string[],
): DraftMetadata {
  const wc =
    firstNumber(raw.word_count, raw.wordCount) ??
    content.trim().split(/\s+/).filter(Boolean).length;
  const est =
    firstNumber(raw.estimated_pages, raw.estimatedPages) ??
    Math.round((wc / WORDS_PER_PAGE) * 10) / 10;

  const cov = firstStringArray(
    raw.requirement_coverage_ids,
    raw.requirementCoverageIds,
  );
  const missRaw = firstStringArray(
    raw.missing_requirement_ids,
    raw.missingRequirementIds,
  );
  const miss =
    missRaw.length > 0 ? missRaw : allReqIds.filter((id) => !cov.includes(id));

  const risks = firstStringArray(raw.risk_flags, raw.riskFlags);
  const unsupported = firstStringArray(
    raw.unsupported_claim_flags,
    raw.unsupportedClaimFlags,
  );

  const meta: DraftMetadata = {
    wordCount: wc,
    estimatedPages: est,
    requirementCoverageIds: cov,
    missingRequirementIds: miss,
    riskFlags: risks,
    unsupportedClaimFlags: unsupported,
  };

  if (meta.estimatedPages > pageLimit + 0.15) {
    meta.riskFlags.push(
      `Estimated ${meta.estimatedPages} pages exceeds ${pageLimit} page limit — condense.`,
    );
  }

  return meta;
}

async function runDraftJson(input: {
  system: string;
  user: string;
}): Promise<Record<string, unknown>> {
  const openai = getOpenAI();
  const model = defaultParseModel();
  const completion = await openai.chat.completions.create({
    model,
    messages: [
      { role: "system", content: input.system },
      { role: "user", content: input.user },
    ],
    response_format: { type: "json_object" },
    temperature: 0.35,
  });
  const text = completion.choices[0]?.message?.content ?? "{}";
  return JSON.parse(text) as Record<string, unknown>;
}

/**
 * Controlled, grounding-only draft generation. Uses structured JSON output.
 * Prefer passing a fully-built {@link DraftingGenerationInput}; bundle can be loaded by id via {@link generateDraftFromBundleId}.
 */
export async function generateGroundedDraft(
  input: DraftingGenerationInput,
): Promise<DraftingGenerationResult> {
  validateGrounding(input.grounding);

  const strategy = SECTION_STRATEGY[input.sectionType];
  const pageLimit =
    typeof input.pageLimit === "number" && input.pageLimit > 0
      ? input.pageLimit
      : strategy.maxPages;
  const constraintRules =
    input.constraintRules?.trim() || strategy.focus;
  const scoring = input.scoringBlocks ?? [...scoringForSectionType(input.sectionType)];

  const reqList = input.grounding.requirements.map((r) => ({
    id: r.id,
    title: r.title,
    summary: r.summary,
    riskLevel: r.riskLevel,
  }));
  const evList = input.grounding.evidence.map((e) => ({
    id: e.id,
    title: e.title,
    excerpt: e.excerpt,
    validationStatus: e.validationStatus,
  }));
  const facts = input.grounding.vendorFacts.map((f) => ({
    text: f.factText,
    validation: f.validationStatus,
    provenance: f.provenanceKind,
    credibility: f.credibility ?? "",
    confidence: f.confidence ?? "",
  }));
  const arch = input.grounding.architectureOptions.map((a) => ({
    id: a.id,
    name: a.name,
    summary: a.summary,
  }));
  const chunkHints = input.grounding.retrievedChunks.slice(0, 8).map((c) => ({
    ref: c.sourceRef,
    excerpt: c.text.slice(0, 600),
  }));

  const allReqIds = reqList.map((r) => r.id);

  const solicitationId =
    input.grounding.rfp?.core?.solicitationNumber?.trim() ?? "";
  const isCanonicalS000000479Solution =
    input.sectionType === "Solution" &&
    solicitationId === S000000479_BID_NUMBER;
  const isCanonicalS000000479Risk =
    input.sectionType === "Risk" &&
    solicitationId === S000000479_BID_NUMBER;
  const isCanonicalS000000479Interview =
    input.sectionType === "Interview" &&
    solicitationId === S000000479_BID_NUMBER;
  const isCanonicalS000000479ExecutiveSummary =
    input.sectionType === "Executive Summary" &&
    solicitationId === S000000479_BID_NUMBER;

  const contract = input.grounding.contract;
  const contractSystemAddendum =
    contract && !contract.stub
      ? `
CONTRACT (SRV-1) — NON-OPTIONAL PROSE DISCIPLINE:
- Make scope of work explicit wherever this section describes commitments.
- State measurable performance standards (metrics, SLAs, timelines) for operational claims.
- Prefer deliverable-based language (what is delivered, when, how verified) over vague assurances.
- Where risk or continuity appears, tie mitigation to termination scenarios (convenience, cause, non-appropriation) when inputs support it — do not invent contract terms beyond the provided contract structure.
`
      : contract?.stub
        ? `
CONTRACT: Stub profile — keep scope and performance claims conservative until full SRV-1 data is attached to the bundle.
`
        : "";

  const system = `You are a proposal drafter for a scored government procurement (1000-point model). Output valid JSON only.

STRICT RULES:
- Use ONLY facts supported by the provided requirements, evidence excerpts, retrieved chunk excerpts, vendor facts, and architecture summaries.
- Vendor facts are ordered with operational, higher-confidence items first. Prefer operational + high/medium confidence for core positioning; treat marketing-only or low-confidence vendor facts as weak support—qualify ("Vendor states…") and do not rest a scored claim primarily on them unless the user explicitly asks for that tone.
- Label inference explicitly in prose only when necessary: "Inferred:" or "Vendor states:" — never present inference as verified fact.
- Do not invent metrics, contracts, or agency commitments.
- Respect page limit (~${pageLimit} pages at ~${WORDS_PER_PAGE} words/page).
- Address scoring emphasis for this section type.
- Surface gaps: if something is missing from inputs, say what is unsupported rather than fabricating.
- Where evidence.validationStatus is Unverified or Pending, do not state associated claims as adjudicated fact; qualify or route to unsupported_claim_flags.
- The metadata.unsupported_claim_flags array must list any substantive claim in your prose that lacks firm grounding in the inputs.
${isCanonicalS000000479Solution ? "- For this solicitation, a canonical Solution exemplar may appear in the user message: use it only for section structure, flow, and evaluator emphasis (~2 pages). Do not treat exemplar text as verified fact; align all claims to the grounding bundle." : ""}
${isCanonicalS000000479Risk ? "- For this solicitation, a canonical Risk Management Plan exemplar may appear in the user message: use it for risk→mitigation→outcome structure and evaluator-facing clarity (~2 pages). Do not treat exemplar text as verified fact; align all claims to the grounding bundle." : ""}
${isCanonicalS000000479Interview ? "- For this solicitation, a canonical Interview / oral-defense exemplar may appear in the user message: use it for Q&A-ready structure and confidence under the Interview score (~30%). Do not treat exemplar text as verified fact; align all claims to Solution/Risk volumes, structured pricing, and the grounding bundle." : ""}
${isCanonicalS000000479ExecutiveSummary ? "- For this solicitation, a canonical Executive Summary exemplar may appear in the user message: use it for single-page tone, alignment across volumes, and immediate evaluator confidence. Do not paste dollar amounts from exemplar unless they appear in structured pricing JSON; do not treat exemplar text as verified fact." : ""}
${contractSystemAddendum}
Return shape:
{"content": string (proposal prose with \\n\\n between paragraphs), "metadata": {"word_count": number, "estimated_pages": number, "requirement_coverage_ids": string[], "missing_requirement_ids": string[], "risk_flags": string[], "unsupported_claim_flags": string[]}}`;

  const regen = input.regeneration;
  const supportExpectation = SECTION_SUPPORT_EXPECTATIONS[input.sectionType];
  const weakEvidence = input.grounding.evidence
    .filter((e) =>
      /unverified|pending/i.test(String(e.validationStatus ?? "")),
    )
    .map((e) => ({
      id: e.id,
      title: e.title,
      validationStatus: e.validationStatus,
    }));

  const rfp = input.grounding.rfp;
  let rfpBlock = "";
  if (rfp) {
    if (rfp.stub || rfp.evaluation.totalScore === 0) {
      rfpBlock = `STRUCTURED RFP: stub profile only (${rfp.core.solicitationNumber}) — keep claims conservative until canonical RFP data is registered.`;
    } else {
      rfpBlock = [
        `STRUCTURED RFP (AUTHORITATIVE — align all scored claims):`,
        `Core: ${JSON.stringify(rfp.core, null, 0)}`,
        `Evaluation weights (%): Experience ${rfp.evaluation.experienceWeight}, Solution ${rfp.evaluation.solutionWeight}, Risk ${rfp.evaluation.riskWeight}, Interview ${rfp.evaluation.interviewWeight} (total ${rfp.evaluation.totalScore}).`,
        `Requirements summary: ${rfp.requirementsSummary.slice(0, 2000)}`,
        `Service expectations: ${JSON.stringify(rfp.serviceExpectations, null, 0)}`,
        `Technical expectations: ${JSON.stringify(rfp.technicalExpectations, null, 0)}`,
        `Risk areas (address honestly; do not dismiss): ${JSON.stringify(rfp.riskAreas, null, 0)}`,
        `Evaluation priorities: ${rfp.evaluationPriorities.join(" | ")}`,
      ].join("\n");
    }
  }

  let pricingBlock = "";
  let pricingNarrativeMappingBlock = "";
  const pr = input.grounding.pricing;
  if (pr) {
    pricingBlock = [
      `STRUCTURED PRICING (use for Solution pricing justification, Risk cost exposure, interview cost defense — do not invent figures beyond this JSON):`,
      JSON.stringify(
        {
          ready: pr.ready,
          contractCompliant: pr.contractCompliant,
          rfpCoverage: pr.rfpCoverage,
          model: pr.model,
          notes: pr.notes.slice(0, 6),
        },
        null,
        0,
      ),
    ].join("\n");
    const categoriesPresent = new Set(
      pr.model.items.map((i) => String(i.category)),
    );
    pricingNarrativeMappingBlock = formatPricingNarrativeMappingForPrompt({
      categoriesPresent,
      lineNamesJoined: pr.model.items.map((i) => i.name).join(" | "),
    });
  }

  let contractBlock = "";
  const ctr = input.grounding.contract;
  if (ctr) {
    if (ctr.stub) {
      contractBlock = `SRV-1 CONTRACT: stub for ${ctr.term.baseYears}/${ctr.term.maxYears}y — defer enforceable commitments until canonical contract data is registered.`;
    } else {
      contractBlock = [
        `CONTRACT STRUCTURE (SRV-1) — follow drafting directives exactly in substance:`,
        ctr.draftingDirectives.map((d) => `- ${d}`).join("\n"),
        `Term: base ${ctr.term.baseYears}y, max ${ctr.term.maxYears}y.`,
        `Payment model: defined rates required=${ctr.paymentModel.requiresDefinedRates}; calculations required=${ctr.paymentModel.requiresCalculation}.`,
        `Termination: ${JSON.stringify(ctr.terminationClauses, null, 0)}`,
        `SRV-1 compliance certifications: ${JSON.stringify(ctr.complianceRequirements, null, 0)}`,
        `Pricing output must support: ${ctr.pricingDirectives.join(" | ")}`,
        `Termination mitigation hooks: ${ctr.terminationMitigationHooks.slice(0, 6).join(" | ")}`,
        ctr.crossCheckWarnings.length > 0
          ? `RFP ↔ CONTRACT CROSS-CHECK (resolve or disclose in prose): ${ctr.crossCheckWarnings.join(" · ")}`
          : "",
      ]
        .filter(Boolean)
        .join("\n");
    }
  }

  let canonicalSolutionBlock = "";
  if (isCanonicalS000000479Solution) {
    canonicalSolutionBlock = formatCanonicalSolutionSectionForPrompt();
  }

  let canonicalRiskBlock = "";
  if (isCanonicalS000000479Risk) {
    canonicalRiskBlock = formatCanonicalRiskSectionForPrompt();
  }

  let canonicalInterviewBlock = "";
  if (isCanonicalS000000479Interview) {
    canonicalInterviewBlock = formatCanonicalInterviewSectionForPrompt();
  }

  let canonicalExecutiveSummaryBlock = "";
  if (isCanonicalS000000479ExecutiveSummary) {
    canonicalExecutiveSummaryBlock = formatCanonicalExecutiveSummaryForPrompt();
  }

  const userParts = [
    `SECTION TYPE: ${input.sectionType}`,
    `PAGE LIMIT: ${pageLimit} pages (hard budget for this section)`,
    `SECTION STRATEGY / FOCUS: ${constraintRules}`,
    rfpBlock ? `${rfpBlock}\n` : "",
    contractBlock ? `${contractBlock}\n` : "",
    pricingBlock ? `${pricingBlock}\n` : "",
    pricingNarrativeMappingBlock ? `${pricingNarrativeMappingBlock}\n` : "",
    canonicalSolutionBlock ? `${canonicalSolutionBlock}\n` : "",
    canonicalRiskBlock ? `${canonicalRiskBlock}\n` : "",
    canonicalInterviewBlock ? `${canonicalInterviewBlock}\n` : "",
    canonicalExecutiveSummaryBlock ? `${canonicalExecutiveSummaryBlock}\n` : "",
    `SUPPORT EXPECTATIONS (evaluators): ${supportExpectation}`,
    `REQUIREMENT PROOF SUPPORT (per requirement id — honor weak/none; do not over-claim):\n${JSON.stringify(input.grounding.requirementSupport ?? {}, null, 0)}`,
    `SCORING MODEL SLICE (address explicitly in prose):\n${scoring.map((s) => `- ${s.name} (${s.maxPoints} pts, weight ${s.weight}): ${s.description}`).join("\n")}`,
    `GROUNDING GAPS (do not contradict; surface honestly in prose or flags):\n${input.grounding.gaps.join("\n") || "(none listed)"}`,
    weakEvidence.length > 0
      ? `EVIDENCE WITH WEAK VERIFICATION (qualify; do not treat as proven):\n${JSON.stringify(weakEvidence.slice(0, 14), null, 0)}`
      : `EVIDENCE WITH WEAK VERIFICATION: (none flagged as Unverified/Pending)`,
    `REQUIREMENTS:\n${JSON.stringify(reqList, null, 0)}`,
    `EVIDENCE:\n${JSON.stringify(evList, null, 0)}`,
    `VENDOR / INTEL FACTS:\n${JSON.stringify(facts, null, 0)}`,
    `ARCHITECTURE OPTIONS:\n${JSON.stringify(arch, null, 0)}`,
    `RETRIEVED SOURCE EXCERPTS:\n${JSON.stringify(chunkHints, null, 0)}`,
    `VALIDATION NOTES FROM BUNDLE:\n${input.grounding.validationNotes.join("\n") || "(none)"}`,
  ];

  if (input.generationModeLabel?.trim()) {
    userParts.push(`REQUESTED GENERATION MODE: ${input.generationModeLabel.trim()}`);
  }
  if (input.strategicDirective?.trim()) {
    userParts.push(
      `GENERATION STRATEGY (apply throughout):\n${input.strategicDirective.trim()}`,
    );
  }

  if (input.tone) {
    userParts.push(`TONE: ${input.tone}`);
  }
  if (regen?.scope === "full" && regen.instruction) {
    userParts.push(`REGENERATE FULL DRAFT TASK: ${regen.instruction}`);
  }
  if (regen?.scope === "paragraph" && regen.existingContent) {
    userParts.push(
      `REGENERATE FIRST PARAGRAPH ONLY: ${regen.instruction ?? "Improve clarity and grounding."}`,
      `EXISTING DRAFT (full text for context; only change opening paragraph):\n${regen.existingContent}`,
    );
  }

  const raw = await runDraftJson({ system, user: userParts.join("\n\n") });
  const content = String(raw.content ?? "");
  if (!content.trim()) {
    throw new Error("Model returned empty content");
  }
  const metaRaw =
    typeof raw.metadata === "object" && raw.metadata !== null
      ? (raw.metadata as Record<string, unknown>)
      : {};

  const metadata = normalizeMetadata(metaRaw, content, pageLimit, allReqIds);

  return { content, metadata };
}

export async function generateDraftFromBundleId(input: {
  projectId: string;
  bundleId: string;
  sectionType: DraftSectionType;
  tone?: string;
  regeneration?: DraftingGenerationInput["regeneration"];
}): Promise<DraftingGenerationResult> {
  const row = await getGroundingBundle(input.bundleId);
  if (!row || row.projectId !== input.projectId) {
    throw new Error("Grounding bundle not found for project");
  }
  const grounding = row.bundlePayloadJson as GroundingBundlePayload;
  const strategy = SECTION_STRATEGY[input.sectionType];
  return generateGroundedDraft({
    sectionType: input.sectionType,
    pageLimit: strategy.maxPages,
    constraintRules: strategy.focus,
    grounding,
    tone: input.tone,
    regeneration: input.regeneration,
  });
}
