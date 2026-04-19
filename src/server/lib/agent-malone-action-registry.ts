import type { AgentMaloneActionType } from "../../types";

export const MALONE_ALLOWED_ACTIONS: readonly AgentMaloneActionType[] = [
  "open_page",
  "build_grounding_bundle",
  "generate_draft",
  "run_vendor_research",
  "compute_vendor_fit",
  "compute_vendor_score",
  "generate_vendor_interview",
  "run_claim_validation",
  "run_failure_simulation",
  "run_role_fit",
  "run_pricing_reality",
  "run_competitor_simulation",
  "run_decision_synthesis",
  "run_narrative_alignment",
  "refresh_final_readiness",
  "copy_export",
  "run_strategy_refresh_recipe",
  "run_vendor_interview_prep_recipe",
] as const;

const VENDOR_SCOPED: ReadonlySet<AgentMaloneActionType> = new Set([
  "run_vendor_research",
  "compute_vendor_fit",
  "compute_vendor_score",
  "generate_vendor_interview",
  "run_claim_validation",
  "run_failure_simulation",
  "run_role_fit",
  "run_pricing_reality",
]);

const BUNDLE_TYPE_SCOPED: ReadonlySet<AgentMaloneActionType> = new Set([
  "build_grounding_bundle",
]);

/** Draft generation needs a matching grounding bundle in the project. */
const GENERATE_DRAFT_SCOPED: ReadonlySet<AgentMaloneActionType> = new Set([
  "generate_draft",
]);

export function isAllowedMaloneAction(
  t: string,
): t is AgentMaloneActionType {
  return (MALONE_ALLOWED_ACTIONS as readonly string[]).includes(t);
}

export function maloneActionRequiresVendor(t: AgentMaloneActionType): boolean {
  return VENDOR_SCOPED.has(t);
}

export function maloneActionRequiresBundleType(t: AgentMaloneActionType): boolean {
  return BUNDLE_TYPE_SCOPED.has(t);
}

export function maloneActionRequiresDraftInputs(t: AgentMaloneActionType): boolean {
  return GENERATE_DRAFT_SCOPED.has(t);
}
