import type { GroundingBundlePayload } from "@/types";
import { defaultParseModel, getOpenAI } from "./openai-client";
import type { DraftSectionType } from "@/types";
import { SECTION_STRATEGY, scoringForSectionType } from "../lib/drafting-constants";
import { getGroundingBundle } from "../repositories/grounding.repo";

export type DraftMetadata = {
  wordCount: number;
  estimatedPages: number;
  requirementCoverageIds: string[];
  missingRequirementIds: string[];
  riskFlags: string[];
  unsupportedClaimFlags: string[];
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

  const system = `You are a proposal drafter for a scored government procurement (1000-point model). Output valid JSON only.

STRICT RULES:
- Use ONLY facts supported by the provided requirements, evidence excerpts, retrieved chunk excerpts, vendor facts, and architecture summaries.
- Label inference explicitly in prose only when necessary: "Inferred:" or "Vendor states:" — never present inference as verified fact.
- Do not invent metrics, contracts, or agency commitments.
- Respect page limit (~${pageLimit} pages at ~${WORDS_PER_PAGE} words/page).
- Address scoring emphasis for this section type.
- Surface gaps: if something is missing from inputs, say what is unsupported rather than fabricating.

Return shape:
{"content": string (proposal prose with \\n\\n between paragraphs), "metadata": {"word_count": number, "estimated_pages": number, "requirement_coverage_ids": string[], "missing_requirement_ids": string[], "risk_flags": string[], "unsupported_claim_flags": string[]}}`;

  const regen = input.regeneration;
  const userParts = [
    `SECTION TYPE: ${input.sectionType}`,
    `PAGE LIMIT: ${pageLimit} pages`,
    `FOCUS: ${constraintRules}`,
    `SCORING CRITERIA (emphasis for evaluators):\n${scoring.map((s) => `- ${s.name} (${s.maxPoints} pts): ${s.description}`).join("\n")}`,
    `GROUNDING GAPS (must not hide):\n${input.grounding.gaps.join("\n") || "(none listed)"}`,
    `REQUIREMENTS:\n${JSON.stringify(reqList, null, 0)}`,
    `EVIDENCE:\n${JSON.stringify(evList, null, 0)}`,
    `VENDOR / INTEL FACTS:\n${JSON.stringify(facts, null, 0)}`,
    `ARCHITECTURE OPTIONS:\n${JSON.stringify(arch, null, 0)}`,
    `RETRIEVED SOURCE EXCERPTS:\n${JSON.stringify(chunkHints, null, 0)}`,
    `VALIDATION NOTES:\n${input.grounding.validationNotes.join("\n")}`,
  ];

  if (input.tone) {
    userParts.push(`TONE: ${input.tone}`);
  }
  if (regen?.scope === "full" && regen.instruction) {
    userParts.push(`REGENERATE FULL DRAFT: ${regen.instruction}`);
  }
  if (regen?.scope === "paragraph" && regen.existingContent) {
    userParts.push(
      `REGENERATE PARAGRAPH index ${regen.paragraphIndex ?? 0}: ${regen.instruction ?? "Improve clarity and grounding."}`,
      `EXISTING DRAFT:\n${regen.existingContent}`,
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
