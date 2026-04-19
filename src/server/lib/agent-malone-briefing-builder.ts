import type {
  AgentMaloneActionType,
  AgentMaloneBriefing,
  AgentMaloneBriefingMode,
  AgentMaloneBriefingRecommendationConfidence,
  AgentMaloneAnswer,
  FinalReadinessOverallState,
} from "../../types";
import type { BidAgentDomain } from "./bid-agent-query-classifier";
import type { BidAgentGatheredContext } from "./bid-agent-toolkit";
import type { DbAgentMaloneMessage } from "../repositories/agent-malone-message.repo";
import type { DbAgentMaloneMemory } from "../repositories/agent-malone-memory.repo";

export function briefingDomainsForMode(mode: AgentMaloneBriefingMode): BidAgentDomain[] {
  switch (mode) {
    case "executive":
      return [
        "competitor_comparison",
        "decision_synthesis",
        "final_readiness",
        "narrative_alignment",
        "pricing_health",
        "submission_readiness",
        "strategy_guidance",
      ];
    case "strategy":
      return [
        "competitor_comparison",
        "decision_synthesis",
        "narrative_alignment",
        "vendor_intelligence",
        "draft_quality",
        "strategy_guidance",
      ];
    case "vendor":
      return [
        "competitor_comparison",
        "decision_synthesis",
        "vendor_intelligence",
        "claim_validation",
        "failure_modes",
        "role_fit",
        "vendor_interview",
      ];
    case "readiness":
      return [
        "final_readiness",
        "submission_readiness",
        "narrative_alignment",
        "pricing_health",
        "vendor_interview",
        "competitor_comparison",
        "decision_synthesis",
      ];
    case "drafting":
      return [
        "draft_quality",
        "narrative_alignment",
        "final_readiness",
        "strategy_guidance",
        "competitor_comparison",
      ];
    case "pricing":
      return ["pricing_health", "decision_synthesis", "competitor_comparison"];
    case "comparison":
      return ["competitor_comparison", "decision_synthesis", "vendor_intelligence"];
    case "default":
    default:
      return [
        "competitor_comparison",
        "decision_synthesis",
        "final_readiness",
        "narrative_alignment",
        "vendor_intelligence",
        "claim_validation",
        "failure_modes",
        "role_fit",
        "vendor_interview",
        "draft_quality",
        "pricing_health",
        "strategy_guidance",
        "submission_readiness",
      ];
  }
}

function deriveReadiness(
  ctx: BidAgentGatheredContext,
): NonNullable<AgentMaloneBriefing["readiness"]> {
  const keyBlockers: string[] = [];
  const keyWarnings: string[] = [];

  if (!ctx.pricing.ready) {
    keyBlockers.push("Pricing workbook / model is not fully ready.");
  }
  if (!ctx.pricing.contractCompliant) {
    keyWarnings.push("Pricing contract cross-check reported gaps.");
  }

  const thinDrafts = ctx.drafts.filter((d) => !d.hasContent || !d.hasGroundingBundle);
  if (thinDrafts.length > 0) {
    keyBlockers.push(
      `${thinDrafts.length} scored draft volume(s) missing content or grounding bundle.`,
    );
  }

  const na = ctx.narrativeAlignment;
  if (na) {
    if (na.overallAlignment === "misaligned" || na.overallAlignment === "drifting") {
      keyWarnings.push(
        `Narrative alignment across sections: ${na.overallAlignment}.`,
      );
    }
    for (const m of na.criticalMisalignments.slice(0, 4)) {
      keyBlockers.push(m.message);
    }
  }

  const ds = ctx.decisionSynthesis;
  if (ds) {
    keyBlockers.push(...ds.criticalRisks.slice(0, 3));
    if (ds.confidence === "provisional" || ds.confidence === "low") {
      keyWarnings.push(`Vendor/stack decision confidence is ${ds.confidence}.`);
    }
  }

  const sim = ctx.competitorSimulation;
  if (sim?.recommendationConfidence === "provisional") {
    keyWarnings.push("Competitor simulation recommendation is provisional.");
  }

  const notReadySub = ctx.submissionItems.filter((i) => i.status !== "Ready").length;
  if (notReadySub > 0) {
    keyWarnings.push(`${notReadySub} submission checklist row(s) are not Ready.`);
  }

  let overallState: FinalReadinessOverallState = "ready_to_submit";
  if (keyBlockers.length >= 3) overallState = "blocked";
  else if (keyBlockers.length > 0) overallState = "not_ready";
  else if (keyWarnings.length >= 2) overallState = "ready_with_risk";
  else overallState = "ready_to_submit";

  return {
    overallState,
    keyBlockers: dedupeStrings(keyBlockers).slice(0, 8),
    keyWarnings: dedupeStrings(keyWarnings).slice(0, 8),
  };
}

function dedupeStrings(xs: string[]): string[] {
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

function recentActivityLines(input: {
  memory: Map<string, DbAgentMaloneMemory>;
  recentMessages: DbAgentMaloneMessage[];
}): string[] {
  const lines: string[] = [];
  const last = input.memory.get("last_action")?.memoryValue;
  const lastRes = input.memory.get("last_action_result")?.memoryValue;
  if (last && lastRes) {
    lines.push(`Last agent workflow: ${last} — ${lastRes.slice(0, 220)}`);
  } else if (last) {
    lines.push(`Last agent workflow: ${last}.`);
  }

  const actions = input.recentMessages
    .filter((m) => m.role === "action")
    .slice(-4);
  for (const m of actions) {
    const t = m.content.trim();
    if (t) lines.push(`Recorded action: ${t.slice(0, 200)}`);
  }

  return dedupeStrings(lines).slice(0, 6);
}

function collectOpenFollowUps(input: {
  ctx: BidAgentGatheredContext;
  memory: Map<string, DbAgentMaloneMemory>;
}): string[] {
  const out: string[] = [];
  const fu = input.memory.get("open_follow_up")?.memoryValue;
  const risk = input.memory.get("open_risk")?.memoryValue;
  if (fu) out.push(fu);
  if (risk) out.push(risk);

  const ds = input.ctx.decisionSynthesis;
  if (ds) {
    out.push(...ds.whatWouldChangeDecision.slice(0, 2));
    out.push(...ds.decisionWarnings.slice(0, 2));
  }

  const na = input.ctx.narrativeAlignment;
  if (na) {
    for (const w of na.warnings.slice(0, 2)) {
      out.push(w.message);
    }
  }

  const vf = input.ctx.vendorFocus;
  const critWeak = vf?.claimValidation.criticalWeakCount ?? 0;
  if (vf && critWeak > 0) {
    out.push(
      `${critWeak} claim(s) flagged as critical weak for ${vf.vendorName}.`,
    );
  }
  if (vf && vf.interview.unresolvedP1 > 0) {
    out.push(
      `${vf.interview.unresolvedP1} unresolved P1 interview question(s) for ${vf.vendorName}.`,
    );
  }

  const ip = input.ctx.interviewProject;
  if (ip) {
    const worst = ip.vendors
      .filter((v) => v.summary.unresolvedP1 > 0)
      .sort((a, b) => b.summary.unresolvedP1 - a.summary.unresolvedP1)[0];
    if (worst) {
      out.push(
        `${worst.vendorName}: ${worst.summary.unresolvedP1} unresolved P1 item(s) (project rollup).`,
      );
    }
  }

  return dedupeStrings(out).slice(0, 10);
}

function nextActionsForMode(
  mode: AgentMaloneBriefingMode,
  ctx: BidAgentGatheredContext,
): AgentMaloneBriefing["nextActions"] {
  const vid = ctx.vendorFocus?.vendorId;
  const arch = ctx.architecture.find((a) => a.recommended)?.id ?? ctx.architecture[0]?.id;

  const base: AgentMaloneBriefing["nextActions"] = [];

  const push = (
    label: string,
    actionType: string,
    target?: string,
  ) => base.push({ label, actionType, target });

  switch (mode) {
    case "executive":
      push("Review client review packet", "open_page", "/output/client-review");
      push("Run decision synthesis snapshot", "run_decision_synthesis");
      push("Open final readiness bundle", "open_page", "/output/final-bundle");
      break;
    case "strategy":
      push("Run competitor simulation", "run_competitor_simulation");
      push("Re-run role fit", "run_role_fit");
      push("Vendor compare", "open_compare", "/vendors/compare");
      break;
    case "vendor":
      push("Run claim validation", "run_claim_validation");
      push("Run failure simulation", "run_failure_simulation");
      push("Open vendor detail", "open_vendor", vid ? `/vendors/${vid}` : "/vendors");
      break;
    case "readiness":
      push("Run narrative alignment", "run_narrative_alignment");
      push("Refresh final readiness", "refresh_final_readiness");
      push("Open submission package", "open_submission", "/output/submission");
      break;
    case "drafting":
      push("Build Solution bundle", "build_grounding_bundle", "/drafts");
      push("Review weakest draft volume", "review_section", "/drafts");
      push("Open drafting workspace", "open_page", "/drafts");
      break;
    case "pricing":
      push("Run pricing reality check", "run_pricing_reality");
      push("Open output / final bundle (pricing)", "open_page", "/output/final-bundle");
      push("Vendor compare (commercial posture)", "open_compare", "/vendors/compare");
      break;
    case "comparison":
      push("Run competitor simulation", "run_competitor_simulation");
      push("Vendor compare", "open_compare", "/vendors/compare");
      push("Run decision synthesis", "run_decision_synthesis");
      break;
    case "default":
    default:
      push("Run narrative alignment", "run_narrative_alignment");
      push("Refresh final readiness", "refresh_final_readiness");
      if (vid) push("Open focused vendor", "open_vendor", `/vendors/${vid}`);
      push("Vendor compare", "open_compare", "/vendors/compare");
      break;
  }

  void arch;
  return base.slice(0, 5);
}

function headlineForMode(
  mode: AgentMaloneBriefingMode,
  ctx: BidAgentGatheredContext,
  focus?: string | null,
): string {
  const bid = ctx.project.bidNumber;
  const sim = ctx.competitorSimulation;
  const lead = sim?.entries.find((e) => e.vendorId === sim.recommendedVendorId);
  const leadName = lead?.vendorName ?? "No clear leader";
  const conf = sim?.recommendationConfidence ?? "provisional";

  switch (mode) {
    case "executive":
      return `${bid} — Executive view: ${leadName} (${conf})`;
    case "strategy":
      return `${bid} — Strategy & posture: ${leadName}`;
    case "vendor":
      return `${bid} — Vendor focus: ${ctx.vendorFocus?.vendorName ?? "current vendor"}`;
    case "readiness":
      return `${bid} — Readiness & submission gate`;
    case "drafting":
      return `${bid} — Drafting & grounding status`;
    case "pricing":
      return `${bid} — Pricing & commercial posture`;
    case "comparison":
      return `${bid} — Competitive comparison`;
    case "default":
    default: {
      const f = focus?.trim();
      return f
        ? `${bid} — ${f.slice(0, 80)}`
        : `${bid} — Bid status: ${leadName} (${conf})`;
    }
  }
}

function summaryForMode(
  mode: AgentMaloneBriefingMode,
  ctx: BidAgentGatheredContext,
  readiness: NonNullable<AgentMaloneBriefing["readiness"]>,
): string {
  const parts: string[] = [];
  parts.push(
    `Project ${ctx.project.title} (${ctx.project.bidNumber}), due ${ctx.project.dueDate}.`,
  );
  parts.push(
    `Readiness posture: ${readiness.overallState.replace(/_/g, " ")} — ${readiness.keyBlockers.length} blocker signal(s), ${readiness.keyWarnings.length} warning(s).`,
  );

  const ds = ctx.decisionSynthesis;
  if (ds) {
    parts.push(
      `Decision synthesis: ${ds.recommendationType} confidence ${ds.confidence} — ${ds.decisionRationale.slice(0, 360)}`,
    );
  } else if (ctx.competitorSimulation) {
    const sim = ctx.competitorSimulation;
    parts.push(
      `Simulation: recommended ${sim.entries.find((e) => e.vendorId === sim.recommendedVendorId)?.vendorName ?? "n/a"} (${sim.recommendationConfidence}).`,
    );
  }

  if (mode === "executive") {
    parts.push(
      "Executive mode emphasizes decision confidence, largest risks, and next moves — details below.",
    );
  } else if (mode === "vendor" && ctx.vendorFocus) {
    parts.push(
      `Vendor lens: ${ctx.vendorFocus.vendorName} — claim mix ${ctx.vendorFocus.claimValidation.strongCount} strong / ${ctx.vendorFocus.claimValidation.weakOrNoneCount} weak or none.`,
    );
  } else if (mode === "drafting") {
    const weak = ctx.drafts
      .filter((d) => !d.hasContent)
      .map((d) => d.sectionType)
      .slice(0, 4);
    if (weak.length) parts.push(`Draft gaps: ${weak.join(", ")}.`);
  } else if (mode === "pricing") {
    parts.push(
      `Pricing model: ${ctx.pricing.ready ? "structured totals available" : "incomplete"}; contract compliant: ${ctx.pricing.contractCompliant ? "yes" : "review"}.`,
    );
  }

  return parts.join("\n\n");
}

export function buildAgentMaloneBriefing(input: {
  projectId: string;
  threadId?: string;
  mode: AgentMaloneBriefingMode;
  ctx: BidAgentGatheredContext;
  memory: Map<string, DbAgentMaloneMemory>;
  recentMessages: DbAgentMaloneMessage[];
  currentFocus?: string | null;
  currentVendorId?: string | null;
  currentArchitectureOptionId?: string | null;
  currentSectionId?: string | null;
}): AgentMaloneBriefing {
  const ctx = input.ctx;
  const readiness = deriveReadiness(ctx);

  const topRisks = dedupeStrings([
    ...(ctx.decisionSynthesis?.criticalRisks ?? []),
    ...(ctx.competitorSimulation?.decisionRisks ?? []),
    ...(ctx.vendorFocus &&
    (ctx.vendorFocus.failureResilience.criticalScenarioCount > 0 ||
      ctx.vendorFocus.failureResilience.overallResilience === "high_risk")
      ? [
          `Failure resilience: ${ctx.vendorFocus.failureResilience.overallResilience} (${ctx.vendorFocus.failureResilience.criticalScenarioCount} critical scenario(s)).`,
        ]
      : []),
  ]).slice(0, 8);

  const topWeaknesses = dedupeStrings([
    ...(ctx.decisionSynthesis?.keyWeaknesses ?? []),
    ...(ctx.vendorFocus && ctx.vendorFocus.claimValidation.weakOrNoneCount > 0
      ? [
          `${ctx.vendorFocus.claimValidation.weakOrNoneCount} weak or unsupported claim row(s) (${ctx.vendorFocus.vendorName}).`,
        ]
      : []),
  ]).slice(0, 8);

  const strongestSignals = dedupeStrings([
    ...(ctx.decisionSynthesis?.keyStrengths ?? []),
    ...(ctx.competitorSimulation?.recommendedRationale ?? []).slice(0, 3),
  ]).slice(0, 8);

  let recentChanges = recentActivityLines({
    memory: input.memory,
    recentMessages: input.recentMessages,
  });
  if (ctx.competitorSimulation?.generatedAt) {
    recentChanges = [
      `Competitor simulation data timestamp: ${ctx.competitorSimulation.generatedAt}.`,
      ...recentChanges,
    ];
  }

  const followUpLines = collectOpenFollowUps({ ctx, memory: input.memory });

  const recConf = (ctx.decisionSynthesis?.confidence ??
    ctx.competitorSimulation?.recommendationConfidence ??
    "provisional") as AgentMaloneBriefingRecommendationConfidence;

  const leadVid =
    ctx.decisionSynthesis?.recommendedVendorId ??
    ctx.competitorSimulation?.recommendedVendorId;
  const leadName =
    ctx.vendors.find((v) => v.id === leadVid)?.name ??
    ctx.vendorFocus?.vendorName ??
    "Undetermined";

  const rationaleText = (
    ctx.decisionSynthesis?.decisionRationale?.trim() ||
    (ctx.competitorSimulation?.recommendedRationale ?? []).join(" ").trim() ||
    "No decision synthesis row; see simulation evidence."
  ).slice(0, 900);

  const recommendation =
    ctx.decisionSynthesis || ctx.competitorSimulation
      ? {
          label:
            ctx.decisionSynthesis?.recommendationType === "multi_vendor_stack"
              ? "Multi-vendor stack"
              : `Lead: ${leadName}`,
          confidence: recConf,
          rationale: rationaleText,
        }
      : undefined;

  const evidence: AgentMaloneBriefing["evidence"] = [
    { label: `Workspace: ${ctx.project.title}`, sourceType: "workspace" },
    { label: "RFP / solicitation context", sourceType: "rfp", pageRoute: "/files" },
    { label: "Pricing structure (workbook)", sourceType: "pricing", pageRoute: "/output/final-bundle" },
  ];
  if (ctx.competitorSimulation) {
    evidence.push({
      label: "Competitor-aware simulation",
      sourceType: "simulation",
      pageRoute: "/vendors/compare",
    });
  }
  if (ctx.decisionSynthesis) {
    evidence.push({
      label: "Decision synthesis",
      sourceType: "decision",
      pageRoute: "/vendors/compare",
    });
  }
  if (ctx.narrativeAlignment) {
    evidence.push({
      label: "Narrative alignment check",
      sourceType: "draft",
      pageRoute: "/review/readiness",
    });
  }
  if (ctx.vendorFocus) {
    evidence.push({
      label: `Vendor: ${ctx.vendorFocus.vendorName}`,
      sourceType: "vendor",
      pageRoute: `/vendors/${ctx.vendorFocus.vendorId}`,
    });
  }

  let conf: AgentMaloneBriefing["confidence"] = "medium";
  if (readiness.overallState === "blocked" || readiness.overallState === "not_ready") {
    conf = "high";
  } else if (recConf === "provisional" || recConf === "low") {
    conf = "low";
  } else if (readiness.overallState === "ready_to_submit" && recConf === "high") {
    conf = "high";
  }

  return {
    projectId: input.projectId,
    threadId: input.threadId,
    mode: input.mode,
    headline: headlineForMode(input.mode, ctx, input.currentFocus),
    summary: summaryForMode(input.mode, ctx, readiness),
    currentFocus: input.currentFocus ?? undefined,
    currentVendorId: input.currentVendorId ?? undefined,
    currentArchitectureOptionId: input.currentArchitectureOptionId ?? undefined,
    currentSectionId: input.currentSectionId ?? undefined,
    recommendation,
    readiness,
    topRisks,
    topWeaknesses,
    strongestSignals,
    recentChanges: dedupeStrings(recentChanges).slice(0, 8),
    openFollowUps: followUpLines,
    nextActions: nextActionsForMode(input.mode, ctx),
    confidence: conf,
    evidence,
    generatedAt: new Date().toISOString(),
  };
}

export function briefingToAgentAnswer(b: AgentMaloneBriefing): AgentMaloneAnswer {
  const sections: AgentMaloneAnswer["sections"] = [
    {
      title: "Readiness",
      content: b.readiness
        ? `${b.readiness.overallState}\n\nBlockers:\n${b.readiness.keyBlockers.map((x) => `• ${x}`).join("\n") || "—"}\n\nWarnings:\n${b.readiness.keyWarnings.map((x) => `• ${x}`).join("\n") || "—"}`
        : "—",
    },
    {
      title: "Recent activity",
      content: b.recentChanges.length ? b.recentChanges.map((x) => `• ${x}`).join("\n") : "No recent recorded workflows in this thread.",
    },
    {
      title: "Open follow-ups",
      content: b.openFollowUps.length ? b.openFollowUps.map((x) => `• ${x}`).join("\n") : "None flagged from current state.",
    },
  ];

  return {
    answerType: "mixed",
    headline: b.headline,
    shortAnswer: b.summary,
    sections,
    confidence: b.confidence,
    evidence: b.evidence.map((e) => ({
      label: e.label,
      sourceType: e.sourceType as AgentMaloneAnswer["evidence"][0]["sourceType"],
      pageRoute: e.pageRoute,
    })),
    suggestedActions: b.nextActions.map((a) => {
      const workflowTypes: AgentMaloneActionType[] = [
        "run_narrative_alignment",
        "refresh_final_readiness",
        "run_competitor_simulation",
        "run_role_fit",
        "run_claim_validation",
        "run_failure_simulation",
        "run_pricing_reality",
        "run_decision_synthesis",
        "build_grounding_bundle",
      ];
      const at = a.actionType as AgentMaloneActionType;
      const isWorkflow = workflowTypes.includes(at);
      return {
        label: a.label,
        actionType: a.actionType,
        target: a.target,
        payload: isWorkflow
          ? {
              actionType: at,
              projectId: b.projectId,
              architectureOptionId: b.currentArchitectureOptionId ?? null,
              vendorId: b.currentVendorId,
              bundleType:
                at === "build_grounding_bundle" ? "Solution" : undefined,
            }
          : undefined,
      };
    }),
    caveats: [
      "Briefing is derived from live project state and thread memory — not a generic chat recap.",
      "Provisional recommendations stay provisional until evidence and interviews close gaps.",
    ],
  };
}
