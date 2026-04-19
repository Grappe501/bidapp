import { buildVendorDecisionSynthesis } from "../../lib/decision-synthesis-engine";
import type {
  AgentMaloneActionRequest,
  AgentMaloneActionResult,
  DraftSectionType,
  GroundingBundleType,
} from "../../types";
import { GROUNDING_BUNDLE_TYPES } from "../../types";
import { runBuildGroundingBundleJob } from "../jobs/build-grounding-bundle.job";
import { listArchitectureComponentsByOptionId, listArchitectureOptionsByProject } from "../repositories/architecture.repo";
import { listGroundingBundlesByProject } from "../repositories/grounding.repo";
import { generateDraftFromBundleId } from "../services/drafting.service";
import {
  defaultComparedVendorIdsForProject,
  runCompetitorAwareSimulation,
} from "../services/competitor-aware-simulation.service";
import { computeVendorPricingReality } from "../services/pricing-reality.service";
import { runVendorClaimValidation } from "../services/vendor-claim-validation.service";
import { runVendorFailureSimulation } from "../services/vendor-failure-mode.service";
import { computeVendorFit } from "../services/vendor-fit.service";
import { generateVendorInterviewQuestions } from "../services/vendor-interview.service";
import { runVendorResearchJob } from "../services/vendor-research.service";
import { runVendorRoleFitAnalysis } from "../services/vendor-role-fit.service";
import { computeVendorScore } from "../services/vendor-scoring.service";
import { gatherBidAgentContext } from "./bid-agent-toolkit";
import { resolveVendorForMaloneAction } from "./agent-malone-resolve-vendor";

function safeErr(e: unknown): string {
  if (e instanceof Error && e.message) return e.message.slice(0, 280);
  return "Operation failed.";
}

function nextNav(target: string, label: string) {
  return [{ label, actionType: "navigate", target }];
}

async function defaultArchitectureOptionId(
  projectId: string,
  preferred?: string | null,
): Promise<string | null> {
  const opts = await listArchitectureOptionsByProject(projectId);
  if (preferred) {
    const o = opts.find((x) => x.id === preferred);
    if (o) return o.id;
  }
  const rec = opts.find((x) => x.recommended);
  return rec?.id ?? opts[0]?.id ?? null;
}

async function stackIdsForOption(architectureOptionId: string | null): Promise<string[]> {
  if (!architectureOptionId) return [];
  const comps = await listArchitectureComponentsByOptionId(architectureOptionId);
  return [
    ...new Set(
      comps.filter((c) => !c.optional && c.vendorId).map((c) => c.vendorId as string),
    ),
  ];
}

function coerceBundleType(raw: string | undefined, hint?: string): GroundingBundleType | null {
  const tryTypes = [raw, hint].filter(Boolean) as string[];
  for (const t of tryTypes) {
    if (GROUNDING_BUNDLE_TYPES.includes(t as GroundingBundleType)) {
      return t as GroundingBundleType;
    }
  }
  return null;
}

function mapBundleToDraftSection(bundleType: string): DraftSectionType | null {
  const m: Record<string, DraftSectionType> = {
    Experience: "Experience",
    Solution: "Solution",
    Risk: "Risk",
    Interview: "Interview",
    "Executive Summary": "Executive Summary",
    architecture_narrative: "Architecture Narrative",
  };
  return m[bundleType] ?? null;
}

export async function executeMaloneAction(input: {
  request: AgentMaloneActionRequest;
  bundleHint?: string;
  question?: string;
  selectedVendorId?: string | null;
}): Promise<AgentMaloneActionResult> {
  const { request } = input;
  const pid = request.projectId;

  try {
    switch (request.actionType) {
      case "open_page": {
        const path = String(
          input.request.additionalParams?.path ??
            input.request.additionalParams?.target ??
            "",
        ).trim();
        if (!path.startsWith("/")) {
          return {
            actionType: request.actionType,
            status: "blocked",
            headline: "No destination path",
            summary: "Provide additionalParams.path (e.g. \"/review/readiness\").",
          };
        }
        return {
          actionType: request.actionType,
          status: "success",
          headline: "Navigation",
          summary: `Open ${path} in the app.`,
          nextActions: nextNav(path, "Open page"),
        };
      }

      case "copy_export": {
        return {
          actionType: request.actionType,
          status: "blocked",
          headline: "Export is workspace-local",
          summary:
            "Use Export / Copy actions on Output, Final readiness, or Review pages. Agent Malone does not stream document binaries.",
          nextActions: [
            { label: "Final readiness", actionType: "navigate", target: "/output/final-bundle" },
            { label: "Review readiness", actionType: "navigate", target: "/review/readiness" },
          ],
        };
      }

      case "build_grounding_bundle": {
        const bt = coerceBundleType(request.bundleType, input.bundleHint);
        if (!bt) {
          return {
            actionType: request.actionType,
            status: "blocked",
            headline: "Bundle type required",
            summary:
              "Specify bundleType (Solution, Risk, Interview, Experience, …) or ask to build a named bundle.",
          };
        }
        const { bundleId } = await runBuildGroundingBundleJob({
          projectId: pid,
          bundleType: bt,
          targetEntityId: request.targetEntityId ?? null,
        });
        return {
          actionType: request.actionType,
          status: "success",
          headline: `${bt} grounding bundle built`,
          summary: "Bundle stored and available for drafting attachment.",
          affectedEntityIds: [bundleId],
          nextActions: nextNav("/drafts", "Open drafts"),
        };
      }

      case "generate_draft": {
        const bt = coerceBundleType(request.bundleType, input.bundleHint);
        if (!bt) {
          return {
            actionType: request.actionType,
            status: "blocked",
            headline: "Section / bundle not specified",
            summary: "Set bundleType (e.g. Solution or Risk) or ask to generate a specific section draft.",
          };
        }
        const sectionType = mapBundleToDraftSection(bt);
        if (!sectionType) {
          return {
            actionType: request.actionType,
            status: "blocked",
            headline: "Draft mapping unavailable",
            summary: `No draft section mapping for bundle type "${bt}".`,
          };
        }
        const bundles = await listGroundingBundlesByProject(pid, bt);
        if (bundles.length === 0) {
          return {
            actionType: request.actionType,
            status: "blocked",
            headline: "No grounding bundle",
            summary: `Build a ${bt} grounding bundle before generating this draft.`,
            nextActions: nextNav("/drafts", "Open drafts"),
          };
        }
        const latest = bundles[0];
        const gen = await generateDraftFromBundleId({
          projectId: pid,
          bundleId: latest.id,
          sectionType,
        });
        const preview = gen.content?.slice(0, 400) ?? "";
        return {
          actionType: request.actionType,
          status: "success",
          headline: `${sectionType} draft generated`,
          summary:
            "Draft text returned by the server — save or edit in the Drafts workspace (generation does not auto-save a version).",
          details: [
            preview
              ? `${preview}${gen.content && gen.content.length > 400 ? "…" : ""}`
              : "(empty content)",
          ],
          affectedEntityIds: [latest.id],
          nextActions: nextNav("/drafts", "Open drafts"),
        };
      }

      case "run_vendor_research":
      case "compute_vendor_fit":
      case "compute_vendor_score":
      case "generate_vendor_interview":
      case "run_claim_validation":
      case "run_failure_simulation":
      case "run_role_fit":
      case "run_pricing_reality": {
        const rv = await resolveVendorForMaloneAction({
          projectId: pid,
          selectedVendorId: request.vendorId ?? input.selectedVendorId,
          question: input.question,
        });
        if (!rv.ok) {
          return {
            actionType: request.actionType,
            status: "blocked",
            headline: "Vendor required",
            summary: rv.message,
            nextActions: nextNav("/vendors", "Open vendors"),
          };
        }
        const arch = await defaultArchitectureOptionId(
          pid,
          request.architectureOptionId,
        );
        const vid = rv.vendorId;

        if (request.actionType === "run_vendor_research") {
            const r = await runVendorResearchJob({ projectId: pid, vendorId: vid });
            return {
              actionType: request.actionType,
              status: "success",
              headline: "Vendor research run completed",
              summary: `Research job finished for ${rv.vendorName}.`,
              details: [
                `URLs ingested: ${r.urlsIngested} · facts ${r.factsCreated} · claims ${r.claimsCreated}`,
              ],
              affectedEntityIds: [vid],
              nextActions: nextNav(`/vendors/${vid}`, "Open vendor"),
            };
          }
          if (request.actionType === "compute_vendor_fit") {
            const r = await computeVendorFit({ projectId: pid, vendorId: vid });
            return {
              actionType: request.actionType,
              status: "success",
              headline: "Vendor fit computed",
              summary: `Fit analysis updated for ${rv.vendorName}.`,
              details: [JSON.stringify(r).slice(0, 500)],
              affectedEntityIds: [vid],
              nextActions: nextNav(`/vendors/${vid}`, "Open vendor"),
            };
          }
          if (request.actionType === "compute_vendor_score") {
            const r = await computeVendorScore(vid);
            return {
              actionType: request.actionType,
              status: "success",
              headline: "Vendor score computed",
              summary: `Scoring updated for ${rv.vendorName}.`,
              details: [JSON.stringify(r).slice(0, 500)],
              affectedEntityIds: [vid],
              nextActions: nextNav(`/vendors/${vid}`, "Open vendor"),
            };
          }
          if (request.actionType === "generate_vendor_interview") {
            const r = await generateVendorInterviewQuestions(vid, pid);
            return {
              actionType: request.actionType,
              status: "success",
              headline: "Interview questions generated",
              summary: `Questions refreshed for ${rv.vendorName}.`,
              details: [JSON.stringify(r).slice(0, 600)],
              affectedEntityIds: [vid],
              nextActions: nextNav(`/vendors/${vid}`, "Open vendor"),
            };
          }
          if (request.actionType === "run_claim_validation") {
            await runVendorClaimValidation({ projectId: pid, vendorId: vid });
            return {
              actionType: request.actionType,
              status: "success",
              headline: "Claim validation re-run",
              summary: `Claim validation updated for ${rv.vendorName}.`,
              affectedEntityIds: [vid],
              nextActions: nextNav(`/vendors/${vid}`, "Open vendor"),
            };
          }
          if (request.actionType === "run_failure_simulation") {
            const summary = await runVendorFailureSimulation({
              projectId: pid,
              vendorId: vid,
              architectureOptionId: arch,
            });
            return {
              actionType: request.actionType,
              status: "success",
              headline: "Failure simulation complete",
              summary: `Resilience assessment updated for ${rv.vendorName}.`,
              details: [
                `Overall resilience: ${summary.overallResilience} · scenarios ${summary.scenarioCount}`,
              ],
              affectedEntityIds: [vid],
              nextActions: nextNav(`/vendors/${vid}`, "Open vendor"),
            };
          }
          if (request.actionType === "run_role_fit") {
            const result = await runVendorRoleFitAnalysis({
              projectId: pid,
              vendorId: vid,
              architectureOptionId: arch,
            });
            return {
              actionType: request.actionType,
              status: "success",
              headline: "Role fit analysis complete",
              summary: `Role fit updated for ${rv.vendorName}.`,
              details: [JSON.stringify(result.summary).slice(0, 500)],
              affectedEntityIds: [vid],
              nextActions: nextNav(`/vendors/${vid}`, "Open vendor"),
            };
          }
        const pr = await computeVendorPricingReality({ projectId: pid, vendorId: vid });
        return {
          actionType: request.actionType,
          status: "success",
          headline: "Pricing reality computed",
          summary: `Pricing reality check updated for ${rv.vendorName}.`,
          details: [JSON.stringify(pr).slice(0, 500)],
          affectedEntityIds: [vid],
          nextActions: nextNav(`/vendors/${vid}`, "Open vendor"),
        };
      }

      case "run_competitor_simulation": {
        const arch = await defaultArchitectureOptionId(
          pid,
          request.architectureOptionId,
        );
        const ids = await defaultComparedVendorIdsForProject(pid);
        if (ids.length === 0) {
          return {
            actionType: request.actionType,
            status: "blocked",
            headline: "No vendors to compare",
            summary: "Add vendors before running competitor simulation.",
            nextActions: nextNav("/vendors", "Open vendors"),
          };
        }
        const sim = await runCompetitorAwareSimulation({
          projectId: pid,
          comparedVendorIds: ids,
          architectureOptionId: arch,
        });
        return {
          actionType: request.actionType,
          status: "success",
          headline: "Competitor simulation complete",
          summary: `Compared ${sim.entries.length} vendor(s). Recommended: ${sim.recommendedVendorId ? "see compare view" : "undetermined"}.`,
          details: [
            sim.recommendedRationale?.slice(0, 4).join(" · ") ?? "",
          ].filter(Boolean),
          nextActions: nextNav("/vendors/compare", "Open vendor compare"),
        };
      }

      case "run_decision_synthesis": {
        const arch = await defaultArchitectureOptionId(
          pid,
          request.architectureOptionId,
        );
        const ids = await defaultComparedVendorIdsForProject(pid);
        if (ids.length === 0) {
          return {
            actionType: request.actionType,
            status: "blocked",
            headline: "No vendors",
            summary: "Add vendors before running decision synthesis.",
          };
        }
        const sim = await runCompetitorAwareSimulation({
          projectId: pid,
          comparedVendorIds: ids,
          architectureOptionId: arch,
        });
        const stacks = await stackIdsForOption(arch);
        const opt = await listArchitectureOptionsByProject(pid);
        const archName = arch ? opt.find((o) => o.id === arch)?.name : undefined;
        const synth = buildVendorDecisionSynthesis({
          sim,
          recommendedVendorStackIds: stacks,
          architectureOptionName: archName,
        });
        return {
          actionType: request.actionType,
          status: "success",
          headline: "Decision synthesis refreshed",
          summary: synth.decisionRationale.slice(0, 500),
          details: synth.whatWouldChangeDecision.slice(0, 5),
          nextActions: nextNav("/vendors/compare", "Open vendor compare"),
        };
      }

      case "run_narrative_alignment":
      case "refresh_final_readiness": {
        const ctx = await gatherBidAgentContext({
          projectId: pid,
          domains: [
            "narrative_alignment",
            "final_readiness",
            "submission_readiness",
            "competitor_comparison",
            "decision_synthesis",
            "pricing_health",
          ],
          selectedVendorId: input.selectedVendorId ?? null,
          architectureOptionId: request.architectureOptionId ?? null,
        });
        const na = ctx.narrativeAlignment;
        const headline =
          request.actionType === "refresh_final_readiness"
            ? "Bid state snapshot refreshed"
            : "Narrative alignment recomputed";
        const sub = na
          ? `Alignment: ${na.overallAlignment}. Critical gaps: ${na.criticalMisalignments.length}.`
          : "Narrative alignment not computed (missing spine or draft text).";
        const pricing = `Pricing model ${ctx.pricing.ready ? "ready" : "not ready"} · $${ctx.pricing.annualTotal.toLocaleString()} annual.`;
        const subCount = ctx.submissionItems.filter((x) => x.status !== "Ready").length;
        return {
          actionType: request.actionType,
          status: na ? "success" : "partial",
          headline,
          summary: `${sub} ${pricing} Submission rows not Ready: ${subCount}.`,
          details: na?.correctiveActions?.slice(0, 6),
          nextActions: [
            { label: "Final readiness bundle", actionType: "navigate", target: "/output/final-bundle" },
            { label: "Review readiness", actionType: "navigate", target: "/review/readiness" },
          ],
        };
      }

      case "run_strategy_refresh_recipe": {
        const arch = await defaultArchitectureOptionId(
          pid,
          request.architectureOptionId,
        );
        const ids = await defaultComparedVendorIdsForProject(pid);
        const details: string[] = [];
        if (ids.length > 0) {
          const sim = await runCompetitorAwareSimulation({
            projectId: pid,
            comparedVendorIds: ids,
            architectureOptionId: arch,
          });
          details.push(`Competitor simulation: ${sim.entries.length} vendor(s).`);
          const stacks = await stackIdsForOption(arch);
          const opt = await listArchitectureOptionsByProject(pid);
          const archName = arch ? opt.find((o) => o.id === arch)?.name : undefined;
          buildVendorDecisionSynthesis({
            sim,
            recommendedVendorStackIds: stacks,
            architectureOptionName: archName,
          });
          details.push("Decision synthesis recomputed from simulation.");
        } else {
          details.push("Skipped competitor simulation — no vendors.");
        }
        const ctx = await gatherBidAgentContext({
          projectId: pid,
          domains: ["narrative_alignment", "final_readiness", "decision_synthesis"],
          selectedVendorId: input.selectedVendorId ?? null,
          architectureOptionId: arch,
        });
        if (ctx.narrativeAlignment) {
          details.push(`Narrative alignment: ${ctx.narrativeAlignment.overallAlignment}.`);
        } else {
          details.push("Narrative alignment partial — add draft text or run compare.");
        }
        return {
          actionType: request.actionType,
          status: "success",
          headline: "Strategy state refreshed",
          summary: "Competitor simulation, decision synthesis, and narrative snapshot updated where inputs allowed.",
          details,
          nextActions: nextNav("/output/final-bundle", "Final readiness"),
        };
      }

      case "run_vendor_interview_prep_recipe": {
        const rv = await resolveVendorForMaloneAction({
          projectId: pid,
          selectedVendorId: request.vendorId ?? input.selectedVendorId,
          question: input.question,
        });
        if (!rv.ok) {
          return {
            actionType: request.actionType,
            status: "blocked",
            headline: "Vendor required",
            summary: rv.message,
          };
        }
        const vid = rv.vendorId;
        const arch = await defaultArchitectureOptionId(
          pid,
          request.architectureOptionId,
        );
        const steps: string[] = [];
        try {
          await runVendorResearchJob({ projectId: pid, vendorId: vid });
          steps.push("Vendor research job completed.");
        } catch (e) {
          steps.push(`Vendor research: ${safeErr(e)}`);
        }
        try {
          await runVendorClaimValidation({ projectId: pid, vendorId: vid });
          steps.push("Claim validation re-run.");
        } catch (e) {
          steps.push(`Claim validation: ${safeErr(e)}`);
        }
        try {
          await computeVendorFit({ projectId: pid, vendorId: vid });
          steps.push("Fit computed.");
        } catch (e) {
          steps.push(`Fit: ${safeErr(e)}`);
        }
        try {
          await computeVendorScore(vid);
          steps.push("Score computed.");
        } catch (e) {
          steps.push(`Score: ${safeErr(e)}`);
        }
        try {
          await generateVendorInterviewQuestions(vid, pid);
          steps.push("Interview questions generated.");
        } catch (e) {
          steps.push(`Interview: ${safeErr(e)}`);
        }
        try {
          await runVendorRoleFitAnalysis({
            projectId: pid,
            vendorId: vid,
            architectureOptionId: arch,
          });
          steps.push("Role fit updated.");
        } catch (e) {
          steps.push(`Role fit: ${safeErr(e)}`);
        }
        return {
          actionType: request.actionType,
          status: "partial",
          headline: `Interview prep steps for ${rv.vendorName}`,
          summary: "Chained vendor workflows executed; review vendor detail for any failures.",
          details: steps,
          affectedEntityIds: [vid],
          nextActions: nextNav(`/vendors/${vid}`, "Open vendor"),
        };
      }

      default:
        return {
          actionType: String(request.actionType),
          status: "blocked",
          headline: "Unsupported action",
          summary: "This action is not available in Agent Malone V2.",
        };
    }
  } catch (e) {
    return {
      actionType: request.actionType,
      status: "failed",
      headline: "Action failed",
      summary: safeErr(e),
      errorMessage: safeErr(e),
    };
  }

  return {
    actionType: request.actionType,
    status: "failed",
    headline: "Internal error",
    summary: "Action handler did not complete.",
  };
}
