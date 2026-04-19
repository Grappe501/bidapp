import { createHash } from "node:crypto";
import type { AgentMaloneBriefing } from "../../types";
import type { BidAgentGatheredContext } from "./bid-agent-toolkit";
import type { DbAgentMaloneBriefingCheckpoint } from "../repositories/agent-malone-briefing-checkpoint.repo";

export type LiveCheckpointSnapshot = {
  lastDecisionSummaryHash: string;
  lastReadinessState: string;
  lastNarrativeAlignmentState: string | null;
  lastRecommendedVendorId: string | null;
  lastRecommendationConfidence: string | null;
  lastOpenBlockerCount: number;
  lastOpenWarningCount: number;
  lastSummaryFingerprint: string;
  threadFocusSnapshot: string | null;
  competitorSimGeneratedAt: string | null;
};

function sha256Short(s: string): string {
  return createHash("sha256").update(s, "utf8").digest("hex").slice(0, 64);
}

export function buildLiveCheckpointSnapshot(input: {
  briefing: AgentMaloneBriefing;
  ctx: BidAgentGatheredContext;
  threadFocus: string | null;
}): LiveCheckpointSnapshot {
  const { briefing, ctx, threadFocus } = input;
  const rationale = briefing.recommendation?.rationale ?? "";
  const leadVid =
    ctx.decisionSynthesis?.recommendedVendorId ??
    ctx.competitorSimulation?.recommendedVendorId ??
    null;
  const recConf =
    briefing.recommendation?.confidence ??
    ctx.competitorSimulation?.recommendationConfidence ??
    null;
  const readiness = briefing.readiness?.overallState ?? "not_ready";
  const na = ctx.narrativeAlignment?.overallAlignment ?? null;
  const blockers = briefing.readiness?.keyBlockers.length ?? 0;
  const warnings = briefing.readiness?.keyWarnings.length ?? 0;

  const fingerprintPayload = JSON.stringify({
    readiness,
    na,
    lead: leadVid,
    conf: recConf,
    blockers,
    warnings,
    simAt: ctx.competitorSimulation?.generatedAt ?? null,
  });

  return {
    lastDecisionSummaryHash: sha256Short(rationale.slice(0, 400)),
    lastReadinessState: readiness,
    lastNarrativeAlignmentState: na,
    lastRecommendedVendorId: leadVid,
    lastRecommendationConfidence: recConf,
    lastOpenBlockerCount: blockers,
    lastOpenWarningCount: warnings,
    lastSummaryFingerprint: sha256Short(fingerprintPayload),
    threadFocusSnapshot: threadFocus?.trim() || null,
    competitorSimGeneratedAt: ctx.competitorSimulation?.generatedAt ?? null,
  };
}

export function dbCheckpointToSnapshot(
  row: DbAgentMaloneBriefingCheckpoint,
): LiveCheckpointSnapshot {
  return {
    lastDecisionSummaryHash: row.lastDecisionSummaryHash,
    lastReadinessState: row.lastReadinessState,
    lastNarrativeAlignmentState: row.lastNarrativeAlignmentState,
    lastRecommendedVendorId: row.lastRecommendedVendorId,
    lastRecommendationConfidence: row.lastRecommendationConfidence,
    lastOpenBlockerCount: row.lastOpenBlockerCount,
    lastOpenWarningCount: row.lastOpenWarningCount,
    lastSummaryFingerprint: row.lastSummaryFingerprint,
    threadFocusSnapshot: row.threadFocusSnapshot,
    competitorSimGeneratedAt: row.competitorSimGeneratedAt,
  };
}

/** Meaningful change worthy of a state-change brief (conservative). */
export function detectMaterialChange(
  prev: LiveCheckpointSnapshot | null,
  curr: LiveCheckpointSnapshot,
): boolean {
  if (!prev) return true;
  if (prev.lastSummaryFingerprint !== curr.lastSummaryFingerprint) return true;
  if (prev.lastReadinessState !== curr.lastReadinessState) return true;
  if (prev.lastRecommendedVendorId !== curr.lastRecommendedVendorId) return true;
  if (prev.lastRecommendationConfidence !== curr.lastRecommendationConfidence) {
    const a = prev.lastRecommendationConfidence ?? "";
    const b = curr.lastRecommendationConfidence ?? "";
    if (a !== b) return true;
  }
  if (prev.lastNarrativeAlignmentState !== curr.lastNarrativeAlignmentState) {
    return true;
  }
  if (
    Math.abs(prev.lastOpenBlockerCount - curr.lastOpenBlockerCount) >= 2 ||
    Math.abs(prev.lastOpenWarningCount - curr.lastOpenWarningCount) >= 3
  ) {
    return true;
  }
  if (
    prev.competitorSimGeneratedAt &&
    curr.competitorSimGeneratedAt &&
    prev.competitorSimGeneratedAt !== curr.competitorSimGeneratedAt
  ) {
    return true;
  }
  return false;
}

export function buildWhatChangedLines(
  prev: LiveCheckpointSnapshot | null,
  curr: LiveCheckpointSnapshot,
  briefing: AgentMaloneBriefing,
): string[] {
  const lines: string[] = [];
  if (!prev) {
    lines.push("First checkpoint for this thread — establishing baseline.");
    lines.push(...briefing.recentChanges.slice(0, 3));
    return dedupe(lines).slice(0, 8);
  }
  if (prev.lastReadinessState !== curr.lastReadinessState) {
    lines.push(
      `Readiness posture moved from ${humanReady(prev.lastReadinessState)} to ${humanReady(curr.lastReadinessState)}.`,
    );
  }
  if (prev.lastRecommendedVendorId !== curr.lastRecommendedVendorId) {
    lines.push(
      "Recommended vendor / stack pointer changed — review decision synthesis and competitor simulation.",
    );
  }
  if (prev.lastRecommendationConfidence !== curr.lastRecommendationConfidence) {
    lines.push(
      `Recommendation confidence is now ${curr.lastRecommendationConfidence ?? "unknown"} (was ${prev.lastRecommendationConfidence ?? "unknown"}).`,
    );
  }
  if (prev.lastNarrativeAlignmentState !== curr.lastNarrativeAlignmentState) {
    lines.push(
      `Narrative alignment is now ${curr.lastNarrativeAlignmentState ?? "n/a"} (was ${prev.lastNarrativeAlignmentState ?? "n/a"}).`,
    );
  }
  if (
    prev.competitorSimGeneratedAt &&
    curr.competitorSimGeneratedAt &&
    prev.competitorSimGeneratedAt !== curr.competitorSimGeneratedAt
  ) {
    lines.push("Competitor simulation was refreshed since the last briefing checkpoint.");
  }
  lines.push(...briefing.recentChanges.slice(0, 4));
  return dedupe(lines).filter(Boolean).slice(0, 8);
}

function humanReady(s: string): string {
  return s.replace(/_/g, " ");
}

function dedupe(xs: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const x of xs) {
    const t = x.trim();
    if (!t || seen.has(t)) continue;
    seen.add(t);
    out.push(t);
  }
  return out;
}

export function buildWhatMattersNow(briefing: AgentMaloneBriefing): string[] {
  const out: string[] = [];
  out.push(...(briefing.readiness?.keyBlockers ?? []).slice(0, 4));
  out.push(...briefing.topRisks.slice(0, 3));
  out.push(...briefing.openFollowUps.slice(0, 3));
  if (briefing.recommendation?.confidence === "provisional") {
    out.push("Decision remains provisional — close evidence and interview gaps before treating it as firm.");
  }
  return dedupe(out).slice(0, 10);
}
