import { query } from "../db/client";

export type DbVendorInterviewQuestionFull = {
  id: string;
  vendorId: string;
  question: string;
  category: string;
  priority: string;
  linkedGapId: string | null;
  whyItMatters: string;
  riskIfUnanswered: string;
  linkedRequirementKeys: string[];
  linkedFitDimensionKeys: string[];
  linkedGapKeys: string[];
  answerStatus: string;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
};

export type DbVendorInterviewAnswer = {
  id: string;
  vendorId: string;
  questionId: string;
  answerText: string;
  answerSource: string;
  answeredBy: string;
  answeredAt: string | null;
  interviewer: string;
  normalizedSummary: string;
  normalizedJson: Record<string, unknown>;
  confidence: string;
  validationStatus: string;
  createdAt: string;
  updatedAt: string;
};

export type DbVendorInterviewAssessment = {
  id: string;
  vendorId: string;
  questionId: string;
  answerId: string | null;
  category: string;
  score0To5: number;
  rationale: string;
  followUpRequired: boolean;
  riskFlag: boolean;
  pricingFlag: boolean;
  integrationFlag: boolean;
  executionFlag: boolean;
  sourceFactIds: string[];
  createdAt: string;
  updatedAt: string;
};

function parseJson<T>(v: unknown, fallback: T): T {
  if (v == null) return fallback;
  if (typeof v === "string") return JSON.parse(v) as T;
  return v as T;
}

function mapQ(row: Record<string, unknown>): DbVendorInterviewQuestionFull {
  return {
    id: String(row.id),
    vendorId: String(row.vendor_id),
    question: String(row.question),
    category: String(row.category),
    priority: String(row.priority),
    linkedGapId:
      row.linked_gap_id == null ? null : String(row.linked_gap_id),
    whyItMatters: String(row.why_it_matters ?? ""),
    riskIfUnanswered: String(row.risk_if_unanswered ?? ""),
    linkedRequirementKeys: parseJson(row.linked_requirement_keys, [] as string[]),
    linkedFitDimensionKeys: parseJson(row.linked_fit_dimension_keys, [] as string[]),
    linkedGapKeys: parseJson(row.linked_gap_keys, [] as string[]),
    answerStatus: String(row.answer_status ?? "unanswered"),
    sortOrder: Number(row.sort_order ?? 0),
    createdAt: new Date(String(row.created_at)).toISOString(),
    updatedAt: new Date(String(row.updated_at)).toISOString(),
  };
}

function mapAns(row: Record<string, unknown>): DbVendorInterviewAnswer {
  return {
    id: String(row.id),
    vendorId: String(row.vendor_id),
    questionId: String(row.question_id),
    answerText: String(row.answer_text ?? ""),
    answerSource: String(row.answer_source ?? ""),
    answeredBy: String(row.answered_by ?? ""),
    answeredAt:
      row.answered_at == null
        ? null
        : new Date(String(row.answered_at)).toISOString(),
    interviewer: String(row.interviewer ?? ""),
    normalizedSummary: String(row.normalized_summary ?? ""),
    normalizedJson: parseJson(row.normalized_json, {} as Record<string, unknown>),
    confidence: String(row.confidence ?? "unknown"),
    validationStatus: String(row.validation_status ?? "unreviewed"),
    createdAt: new Date(String(row.created_at)).toISOString(),
    updatedAt: new Date(String(row.updated_at)).toISOString(),
  };
}

function mapAsmt(row: Record<string, unknown>): DbVendorInterviewAssessment {
  return {
    id: String(row.id),
    vendorId: String(row.vendor_id),
    questionId: String(row.question_id),
    answerId: row.answer_id == null ? null : String(row.answer_id),
    category: String(row.category ?? ""),
    score0To5: Number(row.score_0_to_5 ?? 0),
    rationale: String(row.rationale ?? ""),
    followUpRequired: Boolean(row.follow_up_required),
    riskFlag: Boolean(row.risk_flag),
    pricingFlag: Boolean(row.pricing_flag),
    integrationFlag: Boolean(row.integration_flag),
    executionFlag: Boolean(row.execution_flag),
    sourceFactIds: parseJson(row.source_fact_ids, [] as string[]),
    createdAt: new Date(String(row.created_at)).toISOString(),
    updatedAt: new Date(String(row.updated_at)).toISOString(),
  };
}

export type InterviewQuestionInsertRow = {
  question: string;
  category: string;
  priority: string;
  linkedGapId?: string | null;
  whyItMatters: string;
  riskIfUnanswered: string;
  linkedRequirementKeys: string[];
  linkedFitDimensionKeys: string[];
  linkedGapKeys: string[];
  answerStatus: string;
  sortOrder: number;
};

export async function replaceVendorInterviewQuestionsFull(input: {
  vendorId: string;
  rows: InterviewQuestionInsertRow[];
}): Promise<void> {
  await query(`DELETE FROM vendor_interview_questions WHERE vendor_id = $1`, [
    input.vendorId,
  ]);
  for (const row of input.rows) {
    await query(
      `INSERT INTO vendor_interview_questions (
        vendor_id, question, category, priority, linked_gap_id,
        why_it_matters, risk_if_unanswered,
        linked_requirement_keys, linked_fit_dimension_keys, linked_gap_keys,
        answer_status, sort_order, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8::jsonb, $9::jsonb, $10::jsonb, $11, $12, now())`,
      [
        input.vendorId,
        row.question,
        row.category,
        row.priority,
        row.linkedGapId ?? null,
        row.whyItMatters,
        row.riskIfUnanswered,
        JSON.stringify(row.linkedRequirementKeys),
        JSON.stringify(row.linkedFitDimensionKeys),
        JSON.stringify(row.linkedGapKeys),
        row.answerStatus,
        row.sortOrder,
      ],
    );
  }
}

export async function listVendorInterviewQuestionsFull(
  vendorId: string,
): Promise<DbVendorInterviewQuestionFull[]> {
  const r = await query(
    `SELECT * FROM vendor_interview_questions WHERE vendor_id = $1 ORDER BY sort_order, priority, category`,
    [vendorId],
  );
  return r.rows.map((row: Record<string, unknown>) => mapQ(row));
}

export async function updateVendorInterviewQuestion(input: {
  id: string;
  vendorId: string;
  patch: Partial<{
    question: string;
    category: string;
    priority: string;
    whyItMatters: string;
    riskIfUnanswered: string;
    answerStatus: string;
    sortOrder: number;
  }>;
}): Promise<void> {
  const p = input.patch;
  const sets: string[] = [];
  const vals: unknown[] = [];
  let n = 1;
  if (p.question != null) {
    sets.push(`question = $${n++}`);
    vals.push(p.question);
  }
  if (p.category != null) {
    sets.push(`category = $${n++}`);
    vals.push(p.category);
  }
  if (p.priority != null) {
    sets.push(`priority = $${n++}`);
    vals.push(p.priority);
  }
  if (p.whyItMatters != null) {
    sets.push(`why_it_matters = $${n++}`);
    vals.push(p.whyItMatters);
  }
  if (p.riskIfUnanswered != null) {
    sets.push(`risk_if_unanswered = $${n++}`);
    vals.push(p.riskIfUnanswered);
  }
  if (p.answerStatus != null) {
    sets.push(`answer_status = $${n++}`);
    vals.push(p.answerStatus);
  }
  if (p.sortOrder != null) {
    sets.push(`sort_order = $${n++}`);
    vals.push(p.sortOrder);
  }
  if (sets.length === 0) return;
  sets.push("updated_at = now()");
  vals.push(input.id, input.vendorId);
  await query(
    `UPDATE vendor_interview_questions SET ${sets.join(", ")} WHERE id = $${n++} AND vendor_id = $${n++}`,
    vals,
  );
}

export async function upsertVendorInterviewAnswer(input: {
  vendorId: string;
  questionId: string;
  answerText: string;
  answerSource: string;
  answeredBy: string;
  answeredAt: string | null;
  interviewer: string;
  normalizedSummary?: string;
  normalizedJson?: Record<string, unknown>;
  confidence: string;
  validationStatus: string;
}): Promise<DbVendorInterviewAnswer> {
  const r = await query(
    `INSERT INTO vendor_interview_answers (
      vendor_id, question_id, answer_text, answer_source, answered_by, answered_at,
      interviewer, normalized_summary, normalized_json, confidence, validation_status, updated_at
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9::jsonb, $10, $11, now())
    ON CONFLICT (question_id) DO UPDATE SET
      answer_text = EXCLUDED.answer_text,
      answer_source = EXCLUDED.answer_source,
      answered_by = EXCLUDED.answered_by,
      answered_at = EXCLUDED.answered_at,
      interviewer = EXCLUDED.interviewer,
      normalized_summary = EXCLUDED.normalized_summary,
      normalized_json = EXCLUDED.normalized_json,
      confidence = EXCLUDED.confidence,
      validation_status = EXCLUDED.validation_status,
      updated_at = now()
    RETURNING *`,
    [
      input.vendorId,
      input.questionId,
      input.answerText,
      input.answerSource,
      input.answeredBy,
      input.answeredAt,
      input.interviewer,
      input.normalizedSummary ?? "",
      JSON.stringify(input.normalizedJson ?? {}),
      input.confidence,
      input.validationStatus,
    ],
  );
  return mapAns(r.rows[0] as Record<string, unknown>);
}

export async function upsertVendorInterviewAssessment(input: {
  vendorId: string;
  questionId: string;
  answerId: string | null;
  category: string;
  score0To5: number;
  rationale: string;
  followUpRequired: boolean;
  riskFlag: boolean;
  pricingFlag: boolean;
  integrationFlag: boolean;
  executionFlag: boolean;
  sourceFactIds: string[];
}): Promise<DbVendorInterviewAssessment> {
  const r = await query(
    `INSERT INTO vendor_interview_assessments (
      vendor_id, question_id, answer_id, category, score_0_to_5, rationale,
      follow_up_required, risk_flag, pricing_flag, integration_flag, execution_flag,
      source_fact_ids, updated_at
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12::jsonb, now())
    ON CONFLICT (question_id) DO UPDATE SET
      answer_id = EXCLUDED.answer_id,
      category = EXCLUDED.category,
      score_0_to_5 = EXCLUDED.score_0_to_5,
      rationale = EXCLUDED.rationale,
      follow_up_required = EXCLUDED.follow_up_required,
      risk_flag = EXCLUDED.risk_flag,
      pricing_flag = EXCLUDED.pricing_flag,
      integration_flag = EXCLUDED.integration_flag,
      execution_flag = EXCLUDED.execution_flag,
      source_fact_ids = EXCLUDED.source_fact_ids,
      updated_at = now()
    RETURNING *`,
    [
      input.vendorId,
      input.questionId,
      input.answerId,
      input.category,
      input.score0To5,
      input.rationale,
      input.followUpRequired,
      input.riskFlag,
      input.pricingFlag,
      input.integrationFlag,
      input.executionFlag,
      JSON.stringify(input.sourceFactIds),
    ],
  );
  return mapAsmt(r.rows[0] as Record<string, unknown>);
}

export async function deleteVendorInterviewAssessmentByQuestion(
  questionId: string,
): Promise<void> {
  await query(`DELETE FROM vendor_interview_assessments WHERE question_id = $1`, [
    questionId,
  ]);
}

export async function getVendorInterviewAnswerByQuestion(
  questionId: string,
): Promise<DbVendorInterviewAnswer | null> {
  const r = await query(
    `SELECT * FROM vendor_interview_answers WHERE question_id = $1 LIMIT 1`,
    [questionId],
  );
  if (r.rows.length === 0) return null;
  return mapAns(r.rows[0] as Record<string, unknown>);
}

export async function getVendorInterviewAssessmentByQuestion(
  questionId: string,
): Promise<DbVendorInterviewAssessment | null> {
  const r = await query(
    `SELECT * FROM vendor_interview_assessments WHERE question_id = $1 LIMIT 1`,
    [questionId],
  );
  if (r.rows.length === 0) return null;
  return mapAsmt(r.rows[0] as Record<string, unknown>);
}

export async function getInterviewReadinessSummaryForVendor(vendorId: string): Promise<{
  p1Total: number;
  p1Unanswered: number;
  p1NeedsFollowUp: number;
  unresolvedP1: number;
  avgScore: number | null;
  lowQualityCount: number;
}> {
  const qs = await listVendorInterviewQuestionsFull(vendorId);
  const p1 = qs.filter((q) => q.priority === "P1");
  const p1Unanswered = p1.filter(
    (q) => q.answerStatus === "unanswered" || q.answerStatus === "",
  ).length;
  const p1NeedsFollowUp = p1.filter((q) => q.answerStatus === "needs_follow_up").length;
  const unresolvedP1 = p1Unanswered + p1NeedsFollowUp;

  let scoreSum = 0;
  let scoreN = 0;
  let lowCount = 0;
  for (const q of qs) {
    const a = await getVendorInterviewAssessmentByQuestion(q.id);
    if (a && a.score0To5 >= 0) {
      scoreSum += a.score0To5;
      scoreN += 1;
      if (a.score0To5 <= 2) lowCount += 1;
    }
  }
  return {
    p1Total: p1.length,
    p1Unanswered,
    p1NeedsFollowUp,
    unresolvedP1,
    avgScore: scoreN > 0 ? scoreSum / scoreN : null,
    lowQualityCount: lowCount,
  };
}

export async function getProjectInterviewReadinessSummary(projectId: string): Promise<{
  vendors: Array<{ vendorId: string; vendorName: string; summary: Awaited<ReturnType<typeof getInterviewReadinessSummaryForVendor>> }>;
}> {
  const { listVendorsByProject } = await import("./vendor.repo");
  const vendors = await listVendorsByProject(projectId);
  const out: Array<{
    vendorId: string;
    vendorName: string;
    summary: Awaited<ReturnType<typeof getInterviewReadinessSummaryForVendor>>;
  }> = [];
  for (const v of vendors) {
    const summary = await getInterviewReadinessSummaryForVendor(v.id);
    out.push({ vendorId: v.id, vendorName: v.name, summary });
  }
  return { vendors: out };
}
