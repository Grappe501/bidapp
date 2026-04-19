import type { VendorInterviewNormalizedAnswer } from "../../types";
import { defaultParseModel, getOpenAI } from "./openai-client";
import {
  getVendorById,
} from "../repositories/vendor.repo";
import {
  getVendorInterviewAnswerByQuestion,
  listVendorInterviewQuestionsFull,
  upsertVendorInterviewAnswer,
  upsertVendorInterviewAssessment,
  updateVendorInterviewQuestion,
} from "../repositories/vendor-interview.repo";
import { mergeInterviewEvidenceIntoFitDimensions } from "./vendor-interview-merge.service";
import { computeVendorScore } from "./vendor-scoring.service";

async function runJsonCompletion(input: {
  system: string;
  user: string;
}): Promise<unknown> {
  const openai = getOpenAI();
  const model = defaultParseModel();
  const completion = await openai.chat.completions.create({
    model,
    messages: [
      { role: "system", content: input.system },
      { role: "user", content: input.user },
    ],
    response_format: { type: "json_object" },
    temperature: 0.15,
  });
  const text = completion.choices[0]?.message?.content ?? "{}";
  return JSON.parse(text) as unknown;
}

function parseNormalized(raw: unknown): VendorInterviewNormalizedAnswer {
  const o = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
  const strArr = (k: string): string[] => {
    const v = o[k];
    if (!Array.isArray(v)) return [];
    return v.filter((x): x is string => typeof x === "string");
  };
  const confRaw = String(o.confidence ?? "unknown").toLowerCase();
  const confidence: VendorInterviewNormalizedAnswer["confidence"] =
    confRaw === "high" || confRaw === "medium" || confRaw === "low"
      ? confRaw
      : "unknown";
  return {
    summary: String(o.summary ?? "").slice(0, 4000),
    commitments: strArr("commitments"),
    claims: strArr("claims"),
    limitations: strArr("limitations"),
    dependenciesOnMalone: strArr("dependenciesOnMalone"),
    integrationSignals: strArr("integrationSignals"),
    pricingSignals: strArr("pricingSignals"),
    riskSignals: strArr("riskSignals"),
    timelineSignals: strArr("timelineSignals"),
    followUpQuestions: strArr("followUpQuestions"),
    confidence,
  };
}

export async function normalizeVendorInterviewAnswer(input: {
  vendorId: string;
  questionId: string;
}): Promise<{ normalized: VendorInterviewNormalizedAnswer; stored: boolean }> {
  const v = await getVendorById(input.vendorId);
  if (!v) throw new Error("Vendor not found");
  const ans = await getVendorInterviewAnswerByQuestion(input.questionId);
  if (!ans || !ans.answerText.trim()) {
    throw new Error("No answer text to normalize");
  }
  const qs = await listVendorInterviewQuestionsFull(input.vendorId);
  const q = qs.find((x) => x.id === input.questionId);
  if (!q) throw new Error("Question not found");

  const system = `You normalize vendor interview answers into structured JSON. Treat content as vendor-supplied assertions, not verified facts. Output JSON only with keys: summary (string), commitments, claims, limitations, dependenciesOnMalone, integrationSignals, pricingSignals, riskSignals, timelineSignals, followUpQuestions (string arrays), confidence ("high"|"medium"|"low"|"unknown"). Be concise; empty arrays when none.`;
  const user = `Question category: ${q.category}\nQuestion: ${q.question}\nAnswer:\n${ans.answerText.slice(0, 12_000)}`;

  const raw = await runJsonCompletion({ system, user });
  const normalized = parseNormalized(raw);

  await upsertVendorInterviewAnswer({
    vendorId: input.vendorId,
    questionId: input.questionId,
    answerText: ans.answerText,
    answerSource: ans.answerSource,
    answeredBy: ans.answeredBy,
    answeredAt: ans.answeredAt,
    interviewer: ans.interviewer,
    normalizedSummary: normalized.summary,
    normalizedJson: normalized as unknown as Record<string, unknown>,
    confidence: normalized.confidence,
    validationStatus: ans.validationStatus,
  });

  return { normalized, stored: true };
}

export async function evaluateVendorInterviewAnswer(input: {
  vendorId: string;
  questionId: string;
}): Promise<{ assessmentId: string }> {
  const v = await getVendorById(input.vendorId);
  if (!v) throw new Error("Vendor not found");
  const ans = await getVendorInterviewAnswerByQuestion(input.questionId);
  if (!ans || !ans.answerText.trim()) {
    throw new Error("No answer text to evaluate");
  }
  const qs = await listVendorInterviewQuestionsFull(input.vendorId);
  const q = qs.find((x) => x.id === input.questionId);
  if (!q) throw new Error("Question not found");

  const system = `You evaluate whether a vendor's interview answer resolves the question. Score 0-5: 5=direct, specific, credible; 3=partial; 1=vague/marketing; 0=non-responsive or contradictory. Output JSON: score0To5 (0-5 integer), rationale (string), followUpRequired (boolean), riskFlag, pricingFlag, integrationFlag, executionFlag (booleans), validationStatus one of unreviewed|supported|partially_supported|unsupported|contradicted.`;
  const user = `Category: ${q.category}\nPriority: ${q.priority}\nWhy it matters: ${q.whyItMatters}\nQuestion: ${q.question}\nAnswer:\n${ans.answerText.slice(0, 12_000)}\nNormalized summary:\n${ans.normalizedSummary || "(none)"}`;

  const raw = await runJsonCompletion({ system, user });
  const o = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
  const score0To5 = Math.max(
    0,
    Math.min(5, Math.round(Number(o.score0To5 ?? 0))),
  );
  const validationStatus = String(
    o.validationStatus ?? "unreviewed",
  ).toLowerCase();

  const asmt = await upsertVendorInterviewAssessment({
    vendorId: input.vendorId,
    questionId: input.questionId,
    answerId: ans.id,
    category: q.category,
    score0To5,
    rationale: String(o.rationale ?? "").slice(0, 4000),
    followUpRequired: Boolean(o.followUpRequired),
    riskFlag: Boolean(o.riskFlag),
    pricingFlag: Boolean(o.pricingFlag),
    integrationFlag: Boolean(o.integrationFlag),
    executionFlag: Boolean(o.executionFlag),
    sourceFactIds: [],
  });

  const valStatus =
    validationStatus === "supported" ||
    validationStatus === "partially_supported" ||
    validationStatus === "unsupported" ||
    validationStatus === "contradicted"
      ? validationStatus
      : "unreviewed";

  await upsertVendorInterviewAnswer({
    vendorId: input.vendorId,
    questionId: input.questionId,
    answerText: ans.answerText,
    answerSource: ans.answerSource,
    answeredBy: ans.answeredBy,
    answeredAt: ans.answeredAt,
    interviewer: ans.interviewer,
    normalizedSummary: ans.normalizedSummary,
    normalizedJson: ans.normalizedJson,
    confidence: ans.confidence,
    validationStatus: valStatus,
  });

  await mergeInterviewEvidenceIntoFitDimensions(input.vendorId);
  await computeVendorScore(input.vendorId);

  return { assessmentId: asmt.id };
}

export type SaveVendorInterviewAnswerPayload = {
  questionId: string;
  answerText: string;
  answerSource?: string;
  answeredBy?: string;
  answeredAt?: string | null;
  interviewer?: string;
  answerStatus?: string;
  confidence?: string;
  validationStatus?: string;
  /** Skip OpenAI normalize/evaluate (manual capture only). */
  skipAi?: boolean;
  /** Manual overrides for normalized layer */
  normalizedSummary?: string;
  normalizedJson?: Record<string, unknown>;
};

export async function saveVendorInterviewAnswer(input: {
  projectId: string;
  vendorId: string;
  payload: SaveVendorInterviewAnswerPayload;
}): Promise<{
  answer: Awaited<ReturnType<typeof upsertVendorInterviewAnswer>>;
  normalized?: VendorInterviewNormalizedAnswer;
  evaluated?: boolean;
}> {
  const v = await getVendorById(input.vendorId);
  if (!v || v.projectId !== input.projectId) {
    throw new Error("Vendor not found for project");
  }
  const p = input.payload;
  const qid = p.questionId?.trim() ?? "";
  if (!qid) throw new Error("questionId required");

  const qs = await listVendorInterviewQuestionsFull(input.vendorId);
  const q = qs.find((x) => x.id === qid);
  if (!q) throw new Error("Question not found");

  const answeredAt =
    p.answeredAt != null && p.answeredAt !== ""
      ? new Date(p.answeredAt).toISOString()
      : new Date().toISOString();

  let normalizedSummary = p.normalizedSummary ?? "";
  let normalizedJson = p.normalizedJson ?? {};
  let confidence = (p.confidence ?? "unknown").toLowerCase();
  const validationStatus = (p.validationStatus ?? "unreviewed").toLowerCase();

  let normalized: VendorInterviewNormalizedAnswer | undefined;

  if (!p.skipAi && p.answerText.trim().length > 15) {
    const system = `You normalize vendor interview answers into structured JSON. Treat content as vendor-supplied assertions. Output JSON only with keys: summary, commitments, claims, limitations, dependenciesOnMalone, integrationSignals, pricingSignals, riskSignals, timelineSignals, followUpQuestions (string arrays), confidence ("high"|"medium"|"low"|"unknown").`;
    const user = `Question category: ${q.category}\nQuestion: ${q.question}\nAnswer:\n${p.answerText.slice(0, 12_000)}`;
    const raw = await runJsonCompletion({ system, user });
    normalized = parseNormalized(raw);
    normalizedSummary = normalized.summary;
    normalizedJson = normalized as unknown as Record<string, unknown>;
    if (!p.confidence) {
      confidence = normalized.confidence;
    }
  } else if (p.normalizedSummary?.trim()) {
    normalizedSummary = p.normalizedSummary;
  }

  const answer = await upsertVendorInterviewAnswer({
    vendorId: input.vendorId,
    questionId: qid,
    answerText: p.answerText,
    answerSource: p.answerSource ?? "live_interview",
    answeredBy: p.answeredBy ?? "",
    answeredAt,
    interviewer: p.interviewer ?? "",
    normalizedSummary,
    normalizedJson,
    confidence,
    validationStatus,
  });

  const status =
    p.answerStatus ??
    (p.answerText.trim() ? "answered" : "unanswered");
  await updateVendorInterviewQuestion({
    id: qid,
    vendorId: input.vendorId,
    patch: { answerStatus: status },
  });

  let evaluated = false;
  if (!p.skipAi && p.answerText.trim().length > 15) {
    await evaluateVendorInterviewAnswer({
      vendorId: input.vendorId,
      questionId: qid,
    });
    evaluated = true;
  } else {
    await mergeInterviewEvidenceIntoFitDimensions(input.vendorId);
    await computeVendorScore(input.vendorId);
  }

  return { answer, normalized, evaluated };
}
