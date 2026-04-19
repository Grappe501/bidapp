import {
  buildMachineRationale,
  claimRowWeight,
  computeSupportAndContradiction,
  factWeight,
  isContradictingFactText,
  isCriticalClaimKey,
  normalizeToClaimKey,
  type ConfidenceLevel,
  type ContradictionStatus,
  type ScoringImpact,
  type SupportLevel,
} from "../lib/claim-validation-engine";
import type { ClaimCategory } from "../lib/claim-normalization";
import { listIntelligenceFactsForVendor } from "../repositories/intelligence.repo";
import {
  deleteVendorClaimValidationEvidence,
  insertVendorClaimValidationEvidence,
  listVendorClaimValidations,
  patchVendorClaimValidation,
  upsertVendorClaimValidation,
} from "../repositories/vendor-claim-validation.repo";
import {
  getVendorInterviewAnswerByQuestion,
  getVendorInterviewAssessmentByQuestion,
  listVendorInterviewQuestionsFull,
} from "../repositories/vendor-interview.repo";
import { getVendorById, listVendorClaimsByVendorId } from "../repositories/vendor.repo";
import type { DbVendorClaimRow } from "../repositories/vendor.repo";

type Bucket = {
  key: string;
  category: ClaimCategory;
  claimRows: DbVendorClaimRow[];
  factHits: Array<{
    id: string;
    sourceId: string;
    factText: string;
    credibility: string;
    confidence: string;
    factType: string;
    support: boolean;
    weight: number;
  }>;
  interviewBoost: number;
};

function getOrCreateBucket(
  map: Map<string, Bucket>,
  norm: { key: string; category: ClaimCategory },
): Bucket {
  let b = map.get(norm.key);
  if (!b) {
    b = {
      key: norm.key,
      category: norm.category,
      claimRows: [],
      factHits: [],
      interviewBoost: 0,
    };
    map.set(norm.key, b);
  }
  return b;
}

function sourceTypeFromClaim(c: DbVendorClaimRow): string {
  if (!c.sourceId) return "manual";
  return "website";
}

export async function runVendorClaimValidation(input: {
  projectId: string;
  vendorId: string;
}): Promise<{
  validations: number;
  summary: {
    strong: number;
    weakOrNone: number;
    contradicted: number;
    followUp: number;
  };
}> {
  const vendor = await getVendorById(input.vendorId);
  if (!vendor || vendor.projectId !== input.projectId) {
    throw new Error("Vendor not found for project");
  }

  const [claims, facts, questions] = await Promise.all([
    listVendorClaimsByVendorId(input.vendorId, 200),
    listIntelligenceFactsForVendor({
      projectId: input.projectId,
      vendorId: input.vendorId,
      limit: 200,
    }),
    listVendorInterviewQuestionsFull(input.vendorId),
  ]);

  const buckets = new Map<string, Bucket>();

  for (const c of claims) {
    const norm = normalizeToClaimKey(c.claimText);
    getOrCreateBucket(buckets, norm).claimRows.push(c);
  }

  for (const f of facts) {
    const norm = normalizeToClaimKey(f.factText);
    const contradict = isContradictingFactText(f.factText);
    const w = factWeight({
      credibility: f.credibility,
      confidence: f.confidence,
      factType: f.factType,
    });
    getOrCreateBucket(buckets, norm).factHits.push({
      id: f.id,
      sourceId: f.sourceId,
      factText: f.factText,
      credibility: f.credibility,
      confidence: f.confidence,
      factType: f.factType,
      support: !contradict,
      weight: contradict ? -w : w,
    });
  }

  for (const q of questions) {
    const ans = await getVendorInterviewAnswerByQuestion(q.id);
    const asmt = await getVendorInterviewAssessmentByQuestion(q.id);
    const text = [ans?.normalizedSummary, ans?.answerText].filter(Boolean).join(" ");
    if (!text.trim()) continue;
    const norm = normalizeToClaimKey(text);
    const boost =
      asmt && asmt.score0To5 >= 4
        ? 2.2
        : asmt && asmt.score0To5 >= 3
          ? 1.4
          : 0.7;
    getOrCreateBucket(buckets, norm).interviewBoost += boost;
  }

  let strong = 0;
  let weakOrNone = 0;
  let contradicted = 0;
  let followUp = 0;

  for (const [, bucket] of buckets) {
    let supportScore = bucket.interviewBoost;
    const supportingFactIds: string[] = [];
    const contradictingFactIds: string[] = [];
    const evidenceSourceIds = new Set<string>();

    for (const c of bucket.claimRows) {
      supportScore += claimRowWeight({
        credibility: c.credibility,
        confidence: c.confidence,
      });
      if (c.sourceId) evidenceSourceIds.add(c.sourceId);
    }

    let contradictScore = 0;
    for (const fh of bucket.factHits) {
      evidenceSourceIds.add(fh.sourceId);
      if (fh.support && fh.weight > 0) {
        supportScore += fh.weight;
        supportingFactIds.push(fh.id);
      } else {
        contradictScore += Math.abs(fh.weight);
        contradictingFactIds.push(fh.id);
      }
    }

    const meta = computeSupportAndContradiction({
      supportScore,
      contradictScore,
      claimCount: bucket.claimRows.length,
    });

    const machineClaimText =
      bucket.claimRows[0]?.claimText ??
      facts.find((f) => normalizeToClaimKey(f.factText).key === bucket.key)?.factText ??
      `Topic: ${bucket.key.replace(/\./g, " ")}`;

    const claimSourceType =
      bucket.claimRows.length > 0 ? sourceTypeFromClaim(bucket.claimRows[0]) : "interview";

    const machineRationale = buildMachineRationale({
      key: bucket.key,
      category: bucket.category,
      supportPoints: supportScore,
      contradictPoints: contradictScore,
      supportingFactIds,
      contradictingFactIds,
      claimSourceSummary:
        bucket.claimRows.length > 0
          ? `${bucket.claimRows.length} vendor_claim row(s); facts and interview text scored against taxonomy keys`
          : "Derived from intelligence facts and/or interview text",
    });

    const isCritical = isCriticalClaimKey(bucket.key);

    const row = await upsertVendorClaimValidation({
      vendorId: input.vendorId,
      normalizedClaimKey: bucket.key,
      machineClaimText,
      claimText: machineClaimText,
      claimTextLocked: false,
      claimCategory: bucket.category,
      claimSourceType,
      supportLevel: meta.supportLevel,
      contradictionStatus: meta.contradictionStatus,
      confidence: meta.confidence as ConfidenceLevel,
      needsFollowUp: meta.needsFollowUp,
      followUpReason: meta.followUpReason,
      scoringImpact: meta.scoringImpact as ScoringImpact,
      rationale: machineRationale,
      machineRationale,
      humanNote: "",
      isCritical,
      supportLevelOverride: null,
      evidenceSourceIds: [...evidenceSourceIds],
      supportingFactIds: [...new Set(supportingFactIds)],
      contradictingFactIds: [...new Set(contradictingFactIds)],
      originatingVendorClaimId: bucket.claimRows[0]?.id ?? null,
    });

    await deleteVendorClaimValidationEvidence(row.id);
    for (const fid of supportingFactIds.slice(0, 24)) {
      const fh = bucket.factHits.find((x) => x.id === fid);
      await insertVendorClaimValidationEvidence({
        validationId: row.id,
        sourceId: fh?.sourceId ?? null,
        factId: fid,
        relationType: "support",
      });
    }
    for (const fid of contradictingFactIds.slice(0, 24)) {
      const fh = bucket.factHits.find((x) => x.id === fid);
      await insertVendorClaimValidationEvidence({
        validationId: row.id,
        sourceId: fh?.sourceId ?? null,
        factId: fid,
        relationType: "contradict",
      });
    }

    if (meta.supportLevel === "strong") strong++;
    if (meta.supportLevel === "weak" || meta.supportLevel === "none") weakOrNone++;
    if (meta.contradictionStatus !== "none") contradicted++;
    if (meta.needsFollowUp) followUp++;
  }

  return {
    validations: buckets.size,
    summary: { strong, weakOrNone, contradicted, followUp },
  };
}

export async function patchVendorClaimValidationRecord(input: {
  vendorId: string;
  validationId: string;
  claimText?: string;
  claimTextLocked?: boolean;
  humanNote?: string;
  isCritical?: boolean;
  supportLevelOverride?: string | null;
}): Promise<void> {
  await patchVendorClaimValidation({
    id: input.validationId,
    vendorId: input.vendorId,
    claimText: input.claimText,
    claimTextLocked: input.claimTextLocked,
    humanNote: input.humanNote,
    isCritical: input.isCritical,
    supportLevelOverride: input.supportLevelOverride,
  });
}

export type ClaimValidationPublic = {
  id: string;
  vendorId: string;
  normalizedClaimKey: string;
  claimText: string;
  machineClaimText: string;
  claimTextLocked: boolean;
  claimCategory: string;
  claimSourceType: string;
  supportLevel: SupportLevel;
  effectiveSupportLevel: SupportLevel;
  supportLevelOverride: string | null;
  contradictionStatus: ContradictionStatus;
  confidence: ConfidenceLevel;
  needsFollowUp: boolean;
  followUpReason: string | null;
  scoringImpact: ScoringImpact;
  rationale: string;
  machineRationale: string;
  humanNote: string;
  isCritical: boolean;
  evidenceSourceIds: string[];
  supportingFactIds: string[];
  contradictingFactIds: string[];
  createdAt: string;
  updatedAt: string;
};

function effectiveSupport(
  row: Awaited<ReturnType<typeof listVendorClaimValidations>>[0],
): SupportLevel {
  const o = row.supportLevelOverride?.trim();
  if (o === "none" || o === "weak" || o === "moderate" || o === "strong") return o;
  return row.supportLevel as SupportLevel;
}

export async function listVendorClaimValidationPublic(
  vendorId: string,
): Promise<ClaimValidationPublic[]> {
  const rows = await listVendorClaimValidations(vendorId);
  return rows.map((r) => ({
    id: r.id,
    vendorId: r.vendorId,
    normalizedClaimKey: r.normalizedClaimKey,
    claimText: r.claimText,
    machineClaimText: r.machineClaimText,
    claimTextLocked: r.claimTextLocked,
    claimCategory: r.claimCategory,
    claimSourceType: r.claimSourceType,
    supportLevel: r.supportLevel as SupportLevel,
    effectiveSupportLevel: effectiveSupport(r),
    supportLevelOverride: r.supportLevelOverride,
    contradictionStatus: r.contradictionStatus as ContradictionStatus,
    confidence: r.confidence as ConfidenceLevel,
    needsFollowUp: r.needsFollowUp,
    followUpReason: r.followUpReason,
    scoringImpact: r.scoringImpact as ScoringImpact,
    rationale: r.rationale,
    machineRationale: r.machineRationale,
    humanNote: r.humanNote,
    isCritical: r.isCritical,
    evidenceSourceIds: r.evidenceSourceIds,
    supportingFactIds: r.supportingFactIds,
    contradictingFactIds: r.contradictingFactIds,
    createdAt: r.createdAt,
    updatedAt: r.updatedAt,
  }));
}
