/**
 * Grounded prose review output is consumed by the BP-007 review engine
 * (`review-rules-engine` + readiness scoring) via {@link GroundedProseReviewResult} on draft metadata.
 */
import type {
  DraftSectionType,
  GroundingBundlePayload,
  GroundedProseReviewResult,
  RequirementProofSupportLevel,
  RequirementSupportSummary,
} from "../../types";
import { SECTION_STRATEGY } from "../lib/drafting-constants";
import { defaultParseModel, getOpenAI } from "./openai-client";

export type ProseReviewInput = {
  sectionType: DraftSectionType;
  draftText: string;
  requirements: GroundingBundlePayload["requirements"];
  evidence: GroundingBundlePayload["evidence"];
  requirementSupport: GroundingBundlePayload["requirementSupport"];
  vendorFacts: GroundingBundlePayload["vendorFacts"];
  architectureContext: string;
};

const LEVELS: RequirementProofSupportLevel[] = [
  "strong",
  "partial",
  "weak",
  "none",
];

const CLARITY = ["strong", "moderate", "weak"] as const;
const DENSITY = ["high", "moderate", "low"] as const;
const CONF = ["high", "medium", "low"] as const;
function coerceFindingStatus(
  v: unknown,
): GroundedProseReviewResult["requirement_findings"][number]["status"] {
  const s = String(v ?? "");
  if (
    s === "fully_addressed" ||
    s === "partially_addressed" ||
    s === "not_addressed"
  ) {
    return s;
  }
  return "not_addressed";
}

function coerceLevel(v: unknown): RequirementProofSupportLevel {
  const s = String(v ?? "").toLowerCase();
  if (LEVELS.includes(s as RequirementProofSupportLevel)) {
    return s as RequirementProofSupportLevel;
  }
  return "none";
}

function coerceClarity(v: unknown): GroundedProseReviewResult["clarity"] {
  const s = String(v ?? "").toLowerCase();
  return CLARITY.includes(s as (typeof CLARITY)[number])
    ? (s as GroundedProseReviewResult["clarity"])
    : "moderate";
}

function coerceDensity(
  v: unknown,
): GroundedProseReviewResult["technical_density"] {
  const s = String(v ?? "").toLowerCase();
  return DENSITY.includes(s as (typeof DENSITY)[number])
    ? (s as GroundedProseReviewResult["technical_density"])
    : "moderate";
}

function coerceConf(
  v: unknown,
): GroundedProseReviewResult["confidence"] {
  const s = String(v ?? "").toLowerCase();
  return CONF.includes(s as (typeof CONF)[number])
    ? (s as GroundedProseReviewResult["confidence"])
    : "medium";
}

function normalizeReview(
  raw: Record<string, unknown>,
): GroundedProseReviewResult {
  const reqFindRaw = Array.isArray(raw.requirement_findings)
    ? raw.requirement_findings
    : [];
  const unsupportedRaw = Array.isArray(raw.unsupported_claims)
    ? raw.unsupported_claims
    : [];
  const contraRaw = Array.isArray(raw.contradictions)
    ? raw.contradictions
    : [];
  const actionsRaw = Array.isArray(raw.improvement_actions)
    ? raw.improvement_actions
    : [];

  return {
    clarity: coerceClarity(raw.clarity),
    technical_density: coerceDensity(raw.technical_density),
    metrics_presence: coerceClarity(raw.metrics_presence),
    requirement_findings: reqFindRaw.map((x) => {
      const o = x as Record<string, unknown>;
      return {
        requirement_id: String(o.requirement_id ?? ""),
        status: coerceFindingStatus(o.status),
        support_level: coerceLevel(o.support_level),
        notes: String(o.notes ?? ""),
      };
    }),
    unsupported_claims: unsupportedRaw.map((x) => {
      const o = x as Record<string, unknown>;
      return {
        text: String(o.text ?? ""),
        reason: String(o.reason ?? ""),
        suggested_fix: String(o.suggested_fix ?? ""),
      };
    }),
    contradictions: contraRaw.map((x) => {
      const o = x as Record<string, unknown>;
      return {
        text: String(o.text ?? ""),
        conflicts_with: String(o.conflicts_with ?? ""),
        source_type: String(o.source_type ?? ""),
        explanation: String(o.explanation ?? ""),
      };
    }),
    improvement_actions: actionsRaw.map((a) => String(a)),
    confidence: coerceConf(raw.confidence),
  };
}

export function deriveReviewConfidence(input: {
  requirementSupport: GroundingBundlePayload["requirementSupport"];
  requirementIdsInBundle: string[];
  review: Pick<
    GroundedProseReviewResult,
    "contradictions" | "unsupported_claims"
  >;
}): "high" | "medium" | "low" {
  const ids = input.requirementIdsInBundle;
  const sup = input.requirementSupport;
  let strongN = 0;
  let noneN = 0;
  let verifiedTotal = 0;
  let rowTotal = 0;
  for (const id of ids) {
    const s: RequirementSupportSummary | undefined = sup?.[id];
    if (!s) {
      noneN += 1;
      continue;
    }
    if (s.level === "strong") strongN += 1;
    if (s.level === "none") noneN += 1;
    verifiedTotal += s.validation_mix.verified;
    rowTotal +=
      s.validation_mix.verified +
      s.validation_mix.vendor_claim +
      s.validation_mix.unverified;
  }
  const strongPct = ids.length ? strongN / ids.length : 0;
  const verifiedRatio = rowTotal ? verifiedTotal / rowTotal : 0;
  const contraN = input.review.contradictions.length;
  const unsupN = input.review.unsupported_claims.length;

  if (
    strongPct >= 0.45 &&
    verifiedRatio >= 0.35 &&
    contraN === 0 &&
    unsupN <= 1
  ) {
    return "high";
  }
  if (contraN >= 2 || unsupN >= 4 || strongPct < 0.15 || noneN / Math.max(1, ids.length) > 0.55) {
    return "low";
  }
  return "medium";
}

async function runReviewJson(input: {
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
    temperature: 0.2,
  });
  const text = completion.choices[0]?.message?.content ?? "{}";
  return JSON.parse(text) as Record<string, unknown>;
}

/**
 * Grounded review of draft prose against bundle requirements, evidence, proof support,
 * vendor facts, and architecture context. Structured JSON only; no invented citations.
 */
export async function reviewDraftAgainstGrounding(
  input: ProseReviewInput,
): Promise<GroundedProseReviewResult> {
  const strategy = SECTION_STRATEGY[input.sectionType];
  const support = input.requirementSupport ?? {};

  const evidenceExcerpts = input.evidence.slice(0, 16).map((e) => ({
    id: e.id,
    title: e.title,
    excerpt: e.excerpt.slice(0, 900),
    validationStatus: e.validationStatus,
    evidenceType: e.evidenceType,
  }));

  const system = `You are a procurement proposal reviewer. Output valid JSON only (one object).

STRICT RULES:
- Do not hallucinate evidence or facts. Only reference requirement titles/ids, evidence excerpts, vendor facts, and architecture text provided in the user message.
- Vendor facts may include credibility (operational / marketing / inferred) and confidence (high / medium / low). Prefer operational facts when judging support; flag over-reliance on marketing-only or low-confidence vendor language as weak or unsupported.
- If the draft makes a claim not clearly supported by inputs, list it under unsupported_claims — do not assume missing data proves anything.
- For requirement_findings, use only requirement_id values from the provided requirements list. Set support_level from the provided requirement_support map for each id.
- Flag contradictions when draft text conflicts with vendor facts, architecture summary, or requirement support (e.g. draft asserts live integration but a vendor fact says "planned").
- Use conservative language in notes; you are assisting human evaluators.

Return exactly this JSON shape (arrays may be empty):
{
  "clarity": "strong" | "moderate" | "weak",
  "technical_density": "high" | "moderate" | "low",
  "metrics_presence": "strong" | "moderate" | "weak",
  "requirement_findings": [
    {
      "requirement_id": string,
      "status": "fully_addressed" | "partially_addressed" | "not_addressed",
      "support_level": "strong" | "partial" | "weak" | "none",
      "notes": string
    }
  ],
  "unsupported_claims": [
    { "text": string, "reason": string, "suggested_fix": string }
  ],
  "contradictions": [
    {
      "text": string,
      "conflicts_with": string,
      "source_type": string,
      "explanation": string
    }
  ],
  "improvement_actions": string[],
  "confidence": "high" | "medium" | "low"
}`;

  const user = [
    `SECTION TYPE: ${input.sectionType}`,
    `SECTION STRATEGY: ${strategy.focus} (max ~${strategy.maxPages} pages)`,
    `REQUIREMENTS:\n${JSON.stringify(input.requirements, null, 0)}`,
    `REQUIREMENT SUPPORT (proof graph — do not change levels; copy into support_level):\n${JSON.stringify(support, null, 0)}`,
    `EVIDENCE EXCERPTS:\n${JSON.stringify(evidenceExcerpts, null, 0)}`,
    `VENDOR FACTS:\n${JSON.stringify(input.vendorFacts.slice(0, 24), null, 0)}`,
    `ARCHITECTURE CONTEXT:\n${input.architectureContext}`,
    `DRAFT TEXT:\n${input.draftText}`,
  ].join("\n\n");

  const raw = await runReviewJson({ system, user });
  const parsed = normalizeReview(raw);
  parsed.confidence = deriveReviewConfidence({
    requirementSupport: support,
    requirementIdsInBundle: input.requirements.map((r) => r.id),
    review: parsed,
  });
  return parsed;
}
