import type {
  AgentMaloneActionRequest,
  AgentMaloneActionResult,
  AgentMaloneAnswer,
  AgentMaloneBriefing,
  AgentMaloneThreadSummary,
  AgentMaloneTurnResponse,
  BidAgentAnswer,
  BidAgentAnswerType,
  BidAgentEvidenceSourceType,
  BidAgentSuggestedActionType,
} from "../../types";
import { dbAgentMaloneMemoryToApi } from "../lib/agent-malone-memory-map";
import { briefingToAgentAnswer } from "../lib/agent-malone-briefing-builder";
import { parseBriefingIntentFromQuestion } from "../lib/agent-malone-briefing-intent";
import { applyExplicitUserMemoryCommands } from "../lib/agent-malone-memory-capture";
import {
  memoryRowsByKey,
  resolveArchitectureIdFromPolicy,
  resolveVendorIdFromPolicy,
} from "../lib/agent-malone-memory-policy";
import { executeMaloneAction } from "../lib/agent-malone-actions";
import { isAllowedMaloneAction } from "../lib/agent-malone-action-registry";
import { parseMaloneActionIntentFromQuestion } from "../lib/agent-malone-intent";
import { BID_AGENT_SYSTEM_PROMPT, buildBidAgentUserPrompt } from "../lib/bid-agent-prompts";
import { classifyBidAgentQuery } from "../lib/bid-agent-query-classifier";
import {
  gatherBidAgentContext,
  type BidAgentGatheredContext,
} from "../lib/bid-agent-toolkit";
import type { DbAgentMaloneMemory } from "../repositories/agent-malone-memory.repo";
import {
  listAgentMaloneMemoryByThread,
} from "../repositories/agent-malone-memory.repo";
import {
  insertAgentMaloneMessage,
  listRecentAgentMaloneMessages,
} from "../repositories/agent-malone-message.repo";
import {
  getAgentMaloneThreadById,
  updateAgentMaloneThread,
  type DbAgentMaloneThread,
} from "../repositories/agent-malone-thread.repo";
import { listVendorsByProject } from "../repositories/vendor.repo";
import { getAgentMaloneBriefing } from "./agent-malone-briefing.service";
import {
  buildThreadSummaryLine,
  ensureAgentMaloneThread,
  persistActionResultToWorkingMemory,
  syncPageContextToMemory,
} from "./agent-malone-thread-workflow.service";
import { defaultParseModel, getOpenAI } from "./openai-client";

type MaloneCoreInput = {
  projectId: string;
  question?: string;
  actionRequest?: AgentMaloneActionRequest;
  currentPage?: string;
  selectedVendorId?: string | null;
  architectureOptionId?: string | null;
};

async function tryLoadThreadBundle(input: {
  projectId: string;
  threadId?: string | null;
  question?: string;
  selectedVendorId?: string | null;
  architectureOptionId?: string | null;
  sectionId?: string | null;
}): Promise<{
  thread: DbAgentMaloneThread;
  memory: Map<string, DbAgentMaloneMemory>;
} | null> {
  try {
    const { thread } = await ensureAgentMaloneThread(
      input.projectId,
      input.threadId,
    );
    await syncPageContextToMemory({
      projectId: input.projectId,
      threadId: thread.id,
      selectedVendorId: input.selectedVendorId,
      architectureOptionId: input.architectureOptionId,
      sectionId: input.sectionId,
    });
    let t = (await getAgentMaloneThreadById(thread.id)) ?? thread;
    const q = input.question?.trim() ?? "";
    if (q) {
      const vendors = await listVendorsByProject(input.projectId);
      await applyExplicitUserMemoryCommands({
        projectId: input.projectId,
        threadId: t.id,
        message: q,
        vendors: vendors.map((v) => ({ id: v.id, name: v.name })),
      });
      const refreshed = await getAgentMaloneThreadById(t.id);
      if (refreshed) t = refreshed;
    }
    const rows = await listAgentMaloneMemoryByThread(t.id);
    return { thread: t, memory: memoryRowsByKey(rows) };
  } catch {
    return null;
  }
}

async function persistMaloneTurn(input: {
  projectId: string;
  threadId: string;
  userContent: string;
  executed?: AgentMaloneActionResult;
  answer: AgentMaloneAnswer;
  briefing?: AgentMaloneBriefing;
}): Promise<void> {
  await insertAgentMaloneMessage({
    threadId: input.threadId,
    role: "user",
    content: input.userContent.slice(0, 12000),
  });
  if (input.executed) {
    await persistActionResultToWorkingMemory({
      projectId: input.projectId,
      threadId: input.threadId,
      actionType: input.executed.actionType,
      result: input.executed,
    });
    await insertAgentMaloneMessage({
      threadId: input.threadId,
      role: "action",
      content: input.executed.headline,
      structuredPayload: input.executed,
    });
  }
  await insertAgentMaloneMessage({
    threadId: input.threadId,
    role: "agent",
    content: `${input.answer.headline}\n\n${input.answer.shortAnswer}`.slice(0, 16000),
    structuredPayload: input.briefing
      ? { briefing: input.briefing, answerType: input.answer.answerType }
      : {
          answerType: input.answer.answerType,
          confidence: input.answer.confidence,
        },
  });
  const t = await getAgentMaloneThreadById(input.threadId);
  if (t && !input.briefing) {
    const line = await buildThreadSummaryLine(t);
    await updateAgentMaloneThread({ id: input.threadId, summaryLine: line });
  }
}

const ANSWER_TYPES: BidAgentAnswerType[] = [
  "requirements",
  "readiness",
  "vendor_analysis",
  "pricing",
  "risk",
  "strategy",
  "drafting",
  "submission",
  "comparison",
  "decision",
  "mixed",
];

const EVIDENCE_SOURCES: BidAgentEvidenceSourceType[] = [
  "rfp",
  "technical_packet",
  "contract",
  "pricing",
  "vendor",
  "interview",
  "simulation",
  "decision",
  "draft",
  "workspace",
];

const ACTION_TYPES: BidAgentSuggestedActionType[] = [
  "navigate",
  "rebuild_bundle",
  "run_vendor_research",
  "review_section",
  "open_submission",
  "open_vendor",
  "open_compare",
  "none",
];

function isRecord(x: unknown): x is Record<string, unknown> {
  return typeof x === "object" && x !== null && !Array.isArray(x);
}

function coerceAnswerType(x: unknown): BidAgentAnswerType {
  return typeof x === "string" && ANSWER_TYPES.includes(x as BidAgentAnswerType)
    ? (x as BidAgentAnswerType)
    : "mixed";
}

function coerceEvidenceSource(x: unknown): BidAgentEvidenceSourceType {
  return typeof x === "string" && EVIDENCE_SOURCES.includes(x as BidAgentEvidenceSourceType)
    ? (x as BidAgentEvidenceSourceType)
    : "workspace";
}

function coerceActionType(x: unknown): BidAgentSuggestedActionType {
  return typeof x === "string" && ACTION_TYPES.includes(x as BidAgentSuggestedActionType)
    ? (x as BidAgentSuggestedActionType)
    : "navigate";
}

function defaultEvidence(ctx: BidAgentGatheredContext): BidAgentAnswer["evidence"] {
  const ev: BidAgentAnswer["evidence"] = [
    {
      label: `Project ${ctx.project.bidNumber}`,
      sourceType: "workspace",
      ref: ctx.project.title,
    },
  ];
  ev.push({
    label: "RFP narrative summary",
    sourceType: "rfp",
    pageRoute: "/files",
  });
  ev.push({
    label: "Contract model summary",
    sourceType: "contract",
    pageRoute: "/control/contract",
  });
  ev.push({
    label: "Pricing structure",
    sourceType: "pricing",
    pageRoute: "/output/final-bundle",
  });
  if (ctx.competitorSimulation) {
    ev.push({
      label: "Competitor-aware vendor simulation",
      sourceType: "simulation",
      pageRoute: "/vendors/compare",
    });
  }
  if (ctx.decisionSynthesis) {
    ev.push({
      label: "Decision synthesis",
      sourceType: "decision",
      pageRoute: "/vendors/compare",
    });
  }
  if (ctx.narrativeAlignment) {
    ev.push({
      label: "Narrative alignment",
      sourceType: "draft",
      pageRoute: "/review/readiness",
    });
  }
  if (ctx.vendorFocus) {
    ev.push({
      label: `Vendor focus: ${ctx.vendorFocus.vendorName}`,
      sourceType: "vendor",
      pageRoute: `/vendors/${ctx.vendorFocus.vendorId}`,
    });
  }
  return ev;
}

function defaultActions(ctx: BidAgentGatheredContext): BidAgentAnswer["suggestedActions"] {
  const actions: BidAgentAnswer["suggestedActions"] = [
    { label: "Review bid readiness", actionType: "navigate", target: "/review/readiness" },
    { label: "Open submission package", actionType: "open_submission", target: "/output/submission" },
    { label: "Vendor compare", actionType: "open_compare", target: "/vendors/compare" },
  ];
  if (ctx.vendorFocus) {
    actions.unshift({
      label: `Open ${ctx.vendorFocus.vendorName}`,
      actionType: "open_vendor",
      target: `/vendors/${ctx.vendorFocus.vendorId}`,
    });
  }
  return actions;
}

function fallbackAnswer(
  ctx: BidAgentGatheredContext,
  reason: string,
): BidAgentAnswer {
  const subIncomplete = ctx.submissionItems.filter((i) => i.status !== "Ready").length;
  const draftGaps = ctx.drafts.filter((d) => !d.hasContent || !d.hasGroundingBundle);
  return {
    answerType: "mixed",
    headline: "Structured retrieval summary",
    shortAnswer:
      reason +
      ` Pricing model ${ctx.pricing.ready ? "is ready" : "needs work"}; ` +
      `${subIncomplete} submission row(s) not Ready; ` +
      `${draftGaps.length} draft section(s) need content or grounding.`,
    sections: [
      {
        title: "Pricing",
        content: `Annual $${ctx.pricing.annualTotal.toLocaleString()} · Contract $${ctx.pricing.contractTotal.toLocaleString()} · Compliant: ${ctx.pricing.contractCompliant ? "yes" : "review"}.`,
      },
      {
        title: "Submission checklist",
        content:
          ctx.submissionItems.length === 0
            ? "No submission rows loaded."
            : ctx.submissionItems
                .map((r) => `${r.name}: ${r.status}`)
                .slice(0, 12)
                .join(" · "),
      },
    ],
    confidence: ctx.pricing.ready && subIncomplete === 0 ? "medium" : "low",
    evidence: defaultEvidence(ctx),
    suggestedActions: defaultActions(ctx),
    caveats: [
      "Full narrative synthesis unavailable — showing toolkit summary only.",
      "Recommendation quality depends on up-to-date vendor research and simulations.",
    ],
  };
}

function normalizeAnswer(
  raw: unknown,
  ctx: BidAgentGatheredContext,
): BidAgentAnswer {
  if (!isRecord(raw)) {
    return fallbackAnswer(ctx, "Model returned non-JSON.");
  }

  const headline =
    typeof raw.headline === "string" && raw.headline.trim()
      ? raw.headline.trim()
      : "Answer";

  const shortAnswer =
    typeof raw.shortAnswer === "string" && raw.shortAnswer.trim()
      ? raw.shortAnswer.trim()
      : headline;

  const sections: BidAgentAnswer["sections"] = [];
  if (Array.isArray(raw.sections)) {
    for (const s of raw.sections) {
      if (!isRecord(s)) continue;
      const title = typeof s.title === "string" ? s.title : "Detail";
      const content = typeof s.content === "string" ? s.content : "";
      if (content.trim()) sections.push({ title, content });
    }
  }

  const confidence =
    raw.confidence === "high" || raw.confidence === "medium" || raw.confidence === "low"
      ? raw.confidence
      : "medium";

  const evidence: BidAgentAnswer["evidence"] = [];
  if (Array.isArray(raw.evidence)) {
    for (const e of raw.evidence) {
      if (!isRecord(e)) continue;
      const label = typeof e.label === "string" ? e.label : "Source";
      evidence.push({
        label,
        sourceType: coerceEvidenceSource(e.sourceType),
        ref: typeof e.ref === "string" ? e.ref : undefined,
        pageRoute: typeof e.pageRoute === "string" ? e.pageRoute : undefined,
      });
    }
  }

  const suggestedActions: BidAgentAnswer["suggestedActions"] = [];
  if (Array.isArray(raw.suggestedActions)) {
    for (const a of raw.suggestedActions) {
      if (!isRecord(a)) continue;
      suggestedActions.push({
        label: typeof a.label === "string" ? a.label : "Action",
        actionType: coerceActionType(a.actionType),
        target: typeof a.target === "string" ? a.target : undefined,
      });
    }
  }

  const caveats: string[] = [];
  if (Array.isArray(raw.caveats)) {
    for (const c of raw.caveats) {
      if (typeof c === "string" && c.trim()) caveats.push(c.trim());
    }
  }

  const mergedEvidence = evidence.length > 0 ? evidence : defaultEvidence(ctx);
  const mergedActions =
    suggestedActions.length > 0 ? suggestedActions : defaultActions(ctx);

  return {
    answerType: coerceAnswerType(raw.answerType),
    headline,
    shortAnswer,
    sections,
    confidence,
    evidence: mergedEvidence,
    suggestedActions: mergedActions,
    caveats,
  };
}

function widenToMalone(
  base: BidAgentAnswer,
  executed?: AgentMaloneActionResult,
): AgentMaloneAnswer {
  return {
    ...base,
    suggestedActions: base.suggestedActions.map((s) => ({
      label: s.label,
      actionType: s.actionType,
      target: s.target,
    })),
    executedAction: executed,
  };
}

function buildAnswerFromExecuted(
  executed: AgentMaloneActionResult,
  ctx: BidAgentGatheredContext | null,
): AgentMaloneAnswer {
  const fromNext = (executed.nextActions ?? []).map((n) => ({
    label: n.label,
    actionType: n.actionType,
    target: n.target,
  }));
  const caveats: string[] = [];
  if (executed.status === "blocked" || executed.status === "failed") {
    caveats.push(executed.errorMessage ?? executed.summary);
  }
  if (executed.status === "partial") {
    caveats.push("Some steps in this workflow may need follow-up on the vendor or drafts pages.");
  }
  return {
    answerType: "mixed",
    headline: executed.headline,
    shortAnswer: executed.summary,
    sections: (executed.details ?? []).map((d, i) => ({
      title: `Detail ${i + 1}`,
      content: d,
    })),
    confidence:
      executed.status === "success"
        ? "high"
        : executed.status === "partial"
          ? "medium"
          : "low",
    evidence: ctx ? defaultEvidence(ctx) : [],
    suggestedActions:
      fromNext.length > 0
        ? fromNext
        : ctx
          ? defaultActions(ctx).map((s) => ({
              label: s.label,
              actionType: s.actionType,
              target: s.target,
            }))
          : [],
    executedAction: executed,
    caveats,
  };
}

async function runCoreTurn(
  input: MaloneCoreInput,
  threadPrompt?: {
    threadId: string;
    threadTitle: string;
    summaryLine?: string | null;
    workingMemory: Record<string, string>;
    recentTurns: { role: string; content: string }[];
  },
): Promise<AgentMaloneAnswer> {
  const q = input.question?.trim() ?? "";
  let executed: AgentMaloneActionResult | undefined;

  if (input.actionRequest) {
    const ar = { ...input.actionRequest, projectId: input.projectId };
    if (!isAllowedMaloneAction(ar.actionType)) {
      executed = {
        actionType: ar.actionType,
        status: "blocked",
        headline: "Action not allowed",
        summary: "That action is not in the Agent Malone V2 registry.",
      };
    } else {
      executed = await executeMaloneAction({
        request: ar,
        bundleHint: typeof ar.bundleType === "string" ? ar.bundleType : undefined,
        question: q || undefined,
        selectedVendorId: input.selectedVendorId,
      });
    }
  } else if (q) {
    const intent = parseMaloneActionIntentFromQuestion(q);
    if (intent.kind === "action") {
      const ar: AgentMaloneActionRequest = {
        actionType: intent.actionType,
        projectId: input.projectId,
        architectureOptionId: input.architectureOptionId ?? null,
        vendorId: input.selectedVendorId ?? undefined,
      };
      if (intent.bundleHint) {
        ar.bundleType = intent.bundleHint;
      }
      if (!isAllowedMaloneAction(ar.actionType)) {
        executed = {
          actionType: ar.actionType,
          status: "blocked",
          headline: "Action not allowed",
          summary: "That action is not available.",
        };
      } else {
        executed = await executeMaloneAction({
          request: ar,
          bundleHint: intent.bundleHint,
          question: q,
          selectedVendorId: input.selectedVendorId,
        });
      }
    }
  }

  const needLlm = q.length > 0;

  if (!needLlm) {
    if (!executed) {
      return {
        answerType: "strategy",
        headline: "Agent Malone",
        shortAnswer:
          "Ask a question about this bid, or choose a quick action to run a controlled workflow.",
        sections: [],
        confidence: "high",
        evidence: [],
        suggestedActions: [
          { label: "Open requirements", actionType: "navigate", target: "/requirements" },
        ],
        caveats: [],
      };
    }
    const ctx = await gatherBidAgentContext({
      projectId: input.projectId,
      domains: classifyBidAgentQuery("readiness overview status"),
      selectedVendorId: input.selectedVendorId,
      architectureOptionId: input.architectureOptionId,
    }).catch(() => null);
    return buildAnswerFromExecuted(executed, ctx);
  }

  const domains = classifyBidAgentQuery(q);
  const ctx = await gatherBidAgentContext({
    projectId: input.projectId,
    domains,
    selectedVendorId: input.selectedVendorId,
    architectureOptionId: input.architectureOptionId,
  });

  const openai = getOpenAI();
  const completion = await openai.chat.completions.create({
    model: defaultParseModel(),
    response_format: { type: "json_object" },
    temperature: 0.25,
    messages: [
      { role: "system", content: BID_AGENT_SYSTEM_PROMPT },
      {
        role: "user",
        content: buildBidAgentUserPrompt(
          q,
          domains,
          ctx,
          {
            currentPage: input.currentPage,
            selectedVendorId: input.selectedVendorId,
          },
          executed
            ? {
                actionType: executed.actionType,
                status: executed.status,
                headline: executed.headline,
                summary: executed.summary,
              }
            : undefined,
          threadPrompt,
        ),
      },
    ],
  });

  const rawText = completion.choices[0]?.message?.content ?? "{}";
  let parsed: unknown;
  try {
    parsed = JSON.parse(rawText);
  } catch {
    return widenToMalone(fallbackAnswer(ctx, "Could not parse model JSON."), executed);
  }

  return widenToMalone(normalizeAnswer(parsed, ctx), executed);
}

export async function askAgentMalone(input: {
  projectId: string;
  threadId?: string | null;
  question?: string;
  actionRequest?: AgentMaloneActionRequest;
  currentPage?: string;
  selectedVendorId?: string | null;
  architectureOptionId?: string | null;
  sectionId?: string | null;
  persistTurn?: boolean;
}): Promise<AgentMaloneTurnResponse> {
  const q = input.question?.trim() ?? "";
  const bundle = await tryLoadThreadBundle({
    projectId: input.projectId,
    threadId: input.threadId,
    question: input.question,
    selectedVendorId: input.selectedVendorId,
    architectureOptionId: input.architectureOptionId,
    sectionId: input.sectionId,
  });

  let core: MaloneCoreInput = {
    projectId: input.projectId,
    question: input.question,
    actionRequest: input.actionRequest,
    currentPage: input.currentPage,
    selectedVendorId: input.selectedVendorId ?? null,
    architectureOptionId: input.architectureOptionId ?? null,
  };

  let threadPrompt:
    | {
        threadId: string;
        threadTitle: string;
        summaryLine?: string | null;
        workingMemory: Record<string, string>;
        recentTurns: { role: string; content: string }[];
      }
    | undefined;

  if (bundle) {
    const ev = resolveVendorIdFromPolicy({
      explicitRequest: input.selectedVendorId,
      pageContext: input.selectedVendorId,
      thread: bundle.thread,
      memory: bundle.memory,
    });
    const ea = resolveArchitectureIdFromPolicy({
      explicitRequest: input.architectureOptionId,
      pageContext: input.architectureOptionId,
      thread: bundle.thread,
      memory: bundle.memory,
    });
    core = {
      ...core,
      selectedVendorId: ev,
      architectureOptionId: ea,
    };

    const rows = await listAgentMaloneMemoryByThread(bundle.thread.id);
    const wm: Record<string, string> = {};
    for (const r of rows) {
      wm[r.memoryKey] = r.memoryValue;
    }
    const recent = await listRecentAgentMaloneMessages(bundle.thread.id, 6);
    threadPrompt = {
      threadId: bundle.thread.id,
      threadTitle: bundle.thread.title,
      summaryLine: bundle.thread.summaryLine,
      workingMemory: wm,
      recentTurns: recent.map((m) => ({
        role: m.role,
        content: m.content.slice(0, 1200),
      })),
    };
  }

  const briefingMode =
    q.length > 0 && !input.actionRequest
      ? parseBriefingIntentFromQuestion(q)
      : null;

  if (briefingMode && bundle) {
    const briefing = await getAgentMaloneBriefing({
      projectId: input.projectId,
      threadId: bundle.thread.id,
      mode: briefingMode,
      currentPage: input.currentPage,
      selectedVendorId: input.selectedVendorId,
      architectureOptionId: input.architectureOptionId,
      sectionId: input.sectionId,
      updateThreadSummary: true,
    });
    const answer = briefingToAgentAnswer(briefing);
    const shouldPersist =
      input.persistTurn !== false && (q.length > 0 || Boolean(input.actionRequest));
    if (shouldPersist) {
      try {
        await persistMaloneTurn({
          projectId: input.projectId,
          threadId: bundle.thread.id,
          userContent: q,
          answer,
          briefing,
        });
      } catch {
        /* best-effort */
      }
    }
    const threadAfter =
      (await getAgentMaloneThreadById(bundle.thread.id)) ?? bundle.thread;
    const rowsOut = await listAgentMaloneMemoryByThread(bundle.thread.id);
    const threadSummary: AgentMaloneThreadSummary = {
      threadId: bundle.thread.id,
      projectId: input.projectId,
      title: threadAfter.title,
      currentFocus: threadAfter.currentFocus ?? undefined,
      currentVendorId: threadAfter.currentVendorId ?? undefined,
      currentArchitectureOptionId:
        threadAfter.currentArchitectureOptionId ?? undefined,
      lastUserQuestion: q || undefined,
      lastAgentHeadline: answer.headline,
      summaryLine: threadAfter.summaryLine ?? undefined,
      updatedAt: threadAfter.updatedAt,
    };
    return {
      ...answer,
      threadId: bundle.thread.id,
      threadSummary,
      workingMemorySnapshot: rowsOut.map(dbAgentMaloneMemoryToApi),
      briefing,
    };
  }

  const answer = await runCoreTurn(core, threadPrompt);

  const shouldPersist =
    bundle &&
    input.persistTurn !== false &&
    (q.length > 0 || Boolean(input.actionRequest));

  if (shouldPersist) {
    const userContent =
      q ||
      (input.actionRequest
        ? `[Action] ${input.actionRequest.actionType}`
        : "");
    try {
      await persistMaloneTurn({
        projectId: input.projectId,
        threadId: bundle.thread.id,
        userContent,
        executed: answer.executedAction,
        answer,
      });
    } catch {
      /* persistence is best-effort */
    }
  }

  const threadAfter = bundle
    ? (await getAgentMaloneThreadById(bundle.thread.id)) ?? bundle.thread
    : null;

  const rowsOut = bundle
    ? await listAgentMaloneMemoryByThread(bundle.thread.id)
    : [];

  const threadSummary: AgentMaloneThreadSummary | undefined = bundle
    ? {
        threadId: bundle.thread.id,
        projectId: input.projectId,
        title: threadAfter?.title ?? bundle.thread.title,
        currentFocus: threadAfter?.currentFocus ?? undefined,
        currentVendorId: threadAfter?.currentVendorId ?? undefined,
        currentArchitectureOptionId:
          threadAfter?.currentArchitectureOptionId ?? undefined,
        lastUserQuestion: q || undefined,
        lastAgentHeadline: answer.headline,
        summaryLine: threadAfter?.summaryLine ?? undefined,
        updatedAt: threadAfter?.updatedAt ?? bundle.thread.updatedAt,
      }
    : undefined;

  return {
    ...answer,
    threadId: bundle?.thread.id,
    threadSummary,
    workingMemorySnapshot: bundle ? rowsOut.map(dbAgentMaloneMemoryToApi) : undefined,
  };
}

/** @deprecated Use askAgentMalone — same implementation. */
export const askBidIntelligenceAgent = askAgentMalone;
