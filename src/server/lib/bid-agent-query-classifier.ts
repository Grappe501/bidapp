/**
 * Lightweight keyword router — maps user questions to one or more retrieval domains.
 * Not ML — robust defaults for v1.
 */

export type BidAgentDomain =
  | "rfp_requirements"
  | "technical_packet"
  | "contract_terms"
  | "pricing_health"
  | "submission_readiness"
  | "final_readiness"
  | "vendor_intelligence"
  | "vendor_interview"
  | "claim_validation"
  | "failure_modes"
  | "role_fit"
  | "competitor_comparison"
  | "decision_synthesis"
  | "narrative_alignment"
  | "draft_quality"
  | "strategy_guidance";

export function classifyBidAgentQuery(question: string): BidAgentDomain[] {
  const s = question.trim().toLowerCase();
  if (s.length === 0) return ["strategy_guidance"];

  const out = new Set<BidAgentDomain>();

  if (
    /ready|submit|submission|block|missing|gate|readiness|package|checklist/i.test(s)
  ) {
    out.add("final_readiness");
    out.add("submission_readiness");
    out.add("narrative_alignment");
  }
  if (/pric(e|ing)|cost|fee|workbook|total|hidden|underpric/i.test(s)) {
    out.add("pricing_health");
    out.add("decision_synthesis");
  }
  if (/rfp|solicitation|requirement|mandatory|deliver|matrixcare|emergency|due date|page limit/i.test(s)) {
    out.add("rfp_requirements");
  }
  if (/technical proposal packet|packet|volume|scored volume|no.?link/i.test(s)) {
    out.add("technical_packet");
  }
  if (/contract|srv|term|clause|compliance|arbuy/i.test(s)) {
    out.add("contract_terms");
  }
  if (/vendor|compare|preferred|strongest|weaker|matrixcare integration|stack/i.test(s)) {
    out.add("vendor_intelligence");
    out.add("competitor_comparison");
    out.add("decision_synthesis");
  }
  if (/interview|p1|question.*vendor/i.test(s)) {
    out.add("vendor_interview");
  }
  if (/claim|evidence|support|contradict|weak/i.test(s)) {
    out.add("claim_validation");
  }
  if (/failure|resilien|scenario|stress|mitigation/i.test(s)) {
    out.add("failure_modes");
  }
  if (/role|malone|raci|ownership|handoff/i.test(s)) {
    out.add("role_fit");
  }
  if (/why.*prefer|decision|synthesis|would change|tie|runner/i.test(s)) {
    out.add("decision_synthesis");
    out.add("competitor_comparison");
  }
  if (/align|drift|coherent|story|spine|section.*mis/i.test(s)) {
    out.add("narrative_alignment");
  }
  if (/draft|section|solution|risk|executive|weakness|improve|rewrite|tighter/i.test(s)) {
    out.add("draft_quality");
  }
  if (/strategy|win|differentiat|next step|fix first/i.test(s)) {
    out.add("strategy_guidance");
  }

  if (out.size === 0) {
    out.add("strategy_guidance");
    out.add("final_readiness");
  }

  if (/biggest|overall|summarize|whole bid|assess|health|status/i.test(s)) {
    out.add("final_readiness");
    out.add("competitor_comparison");
    out.add("pricing_health");
    out.add("draft_quality");
    out.add("narrative_alignment");
    out.add("claim_validation");
  }

  return [...out];
}
