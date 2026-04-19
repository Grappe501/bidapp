import type {
  AgentMaloneActionRequest,
  AgentMaloneActionResult,
  AgentMaloneAnswer,
  BidAgentAnswer,
  BidAgentAnswerType,
  BidAgentEvidenceSourceType,
  BidAgentSuggestedActionType,
} from "../../types";
import { executeMaloneAction } from "../lib/agent-malone-actions";
import { isAllowedMaloneAction } from "../lib/agent-malone-action-registry";
import { parseMaloneActionIntentFromQuestion } from "../lib/agent-malone-intent";
import { BID_AGENT_SYSTEM_PROMPT, buildBidAgentUserPrompt } from "../lib/bid-agent-prompts";
import { classifyBidAgentQuery } from "../lib/bid-agent-query-classifier";
import {
  gatherBidAgentContext,
  type BidAgentGatheredContext,
} from "../lib/bid-agent-toolkit";
import { defaultParseModel, getOpenAI } from "./openai-client";

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

export async function askAgentMalone(input: {
  projectId: string;
  question?: string;
  actionRequest?: AgentMaloneActionRequest;
  currentPage?: string;
  selectedVendorId?: string | null;
  architectureOptionId?: string | null;
}): Promise<AgentMaloneAnswer> {
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

/** @deprecated Use askAgentMalone — same implementation. */
export const askBidIntelligenceAgent = askAgentMalone;
