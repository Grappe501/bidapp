/**
 * Decision-grade interview framework for S479-style pharmacy / HDC procurements.
 * Questions are bid-shaped (MatrixCare, Malone, ARBuy, 24/7, emergency delivery) — not generic.
 */

export type InterviewCategory =
  | "capability"
  | "integration"
  | "execution"
  | "pricing"
  | "risk"
  | "differentiation"
  | "stack_role"
  | "proof"
  | "truth_test";

export type InterviewPriority = "P1" | "P2" | "P3";

export type FrameworkQuestionSeed = {
  category: InterviewCategory;
  priority: InterviewPriority;
  question: string;
  whyItMatters: string;
  riskIfUnanswered: string;
  /** Template keys for linkage hints */
  linkedFitDimensionKeys?: string[];
  linkedRequirementPatterns?: string[];
};

/** Core bank — expanded per vendor with {vendorName}, {stackHint} substitution. */
export const INTERVIEW_FRAMEWORK_BANK: FrameworkQuestionSeed[] = [
  {
    category: "capability",
    priority: "P1",
    question:
      "Describe your exact service scope for institutional pharmacy across five HDCs: dispensing, packaging, prior authorization, billing, and clinical coverage — what is in-scope vs explicitly out-of-scope for {vendorName}?",
    whyItMatters:
      "Scope drift is the #1 post-award dispute; evaluators score Solution on operational completeness.",
    riskIfUnanswered: "Ambiguous scope → pricing risk, SOW gaps, and Interview challenge.",
    linkedFitDimensionKeys: ["technical_capability"],
    linkedRequirementPatterns: ["pharmacy", "24/7", "dispensing"],
  },
  {
    category: "proof",
    priority: "P1",
    question:
      "Provide two comparable deployments (state Medicaid, ICF/IID, or similar facility count) with outcomes, staffing ratios, and references we may verify.",
    whyItMatters: "Experience score is evidence-backed; unsubstantiated claims are weak under Interview.",
    riskIfUnanswered: "Experience volume may be scored as thin or marketing-heavy.",
    linkedFitDimensionKeys: ["references_proof"],
  },
  {
    category: "integration",
    priority: "P1",
    question:
      "What is your MatrixCare (or state-designated EHR) integration path: interfaces owned, data flows, testing, rollback, and who owns remediation when the interface fails?",
    whyItMatters: "Integration is a scored failure mode; unknown rows are already flagged in fit data.",
    riskIfUnanswered: "Unknown integration status blocks confident Solution/Risk narrative.",
    linkedFitDimensionKeys: ["integration_fit"],
    linkedRequirementPatterns: ["MatrixCare", "EHR", "integration"],
  },
  {
    category: "integration",
    priority: "P1",
    question:
      "What must Malone (prime orchestration) build, configure, or operate vs what {vendorName} delivers for the integration layer? List dependencies and SLAs.",
    whyItMatters: "Stack clarity is required for honest architecture narrative and Malone dependency disclosure.",
    riskIfUnanswered: "Malone may inherit hidden integration burden — execution and cost risk.",
    linkedFitDimensionKeys: ["integration_fit"],
    linkedRequirementPatterns: ["integration"],
  },
  {
    category: "execution",
    priority: "P1",
    question:
      "Describe your 2-hour emergency delivery model: geography, courier, after-hours staffing, pharmacy coverage, and failure modes when weather or staffing stress the network.",
    whyItMatters: "Emergency delivery is a critical RFP requirement; vague answers crater Risk.",
    riskIfUnanswered: "Evaluators treat emergency delivery as a credibility test under risk.",
    linkedFitDimensionKeys: ["delivery_operations"],
    linkedRequirementPatterns: ["emergency", "delivery"],
  },
  {
    category: "execution",
    priority: "P1",
    question:
      "What is your implementation plan from contract execution to steady-state: phases, milestones, dependencies on state/DHS, and realistic go-live date?",
    whyItMatters: "Misaligned timelines break Solution and Risk alignment with the 45-day implementation posture.",
    riskIfUnanswered: "Schedule slip risk and Interview inconsistency with written volumes.",
    linkedFitDimensionKeys: ["delivery_operations"],
  },
  {
    category: "pricing",
    priority: "P1",
    question:
      "Walk through pricing assumptions: what is included vs excluded, pass-through vs fixed, and how cost volatility (drug, labor, fuel) is handled over the contract term.",
    whyItMatters: "Commercial credibility is scored indirectly via consistency and risk posture.",
    riskIfUnanswered: "Unsupported commercial assumptions → pricing challenge in Interview.",
    linkedFitDimensionKeys: ["risk_posture"],
    linkedRequirementPatterns: ["pric", "cost"],
  },
  {
    category: "risk",
    priority: "P1",
    question:
      "What are the top three failure scenarios for this contract and the concrete mitigations and monitoring you will operate (not just policy language)?",
    whyItMatters: "Risk volume must align; generic answers fail under oral probing.",
    riskIfUnanswered: "Risk narrative may be scored as weak or boilerplate.",
    linkedFitDimensionKeys: ["risk_posture"],
  },
  {
    category: "stack_role",
    priority: "P2",
    question:
      "What exact process segments does {vendorName} own end-to-end vs support vs partner, relative to {stackHint}?",
    whyItMatters: "Clarifies procurement story and subcontractor / flow-down risk.",
    riskIfUnanswered: "Ambiguous roles create contract and SOW exposure.",
    linkedFitDimensionKeys: ["integration_fit"],
  },
  {
    category: "differentiation",
    priority: "P2",
    question:
      "Against other shortlisted vendors, what are three differentiators you can defend with evidence (not slogans) for this solicitation?",
    whyItMatters: "Differentiation must survive Interview and competitor comparison.",
    riskIfUnanswered: "Solution may read as interchangeable.",
    linkedFitDimensionKeys: ["technical_capability"],
  },
  {
    category: "proof",
    priority: "P2",
    question:
      "What operational metrics do you report today (fill rates, turnaround, adverse events, audit findings) and how often are they reviewed with clients?",
    whyItMatters: "Metrics strengthen Experience and Interview credibility.",
    riskIfUnanswered: "Proof gap vs competitors with measurable programs.",
    linkedFitDimensionKeys: ["references_proof"],
  },
  {
    category: "integration",
    priority: "P2",
    question:
      "How do you handle HIPAA, PHI, audit logging, and breach notification in integrations with state systems and Malone-managed workflows?",
    whyItMatters: "Compliance and security are evaluator hot buttons.",
    riskIfUnanswered: "Security ambiguity increases Risk score exposure.",
    linkedFitDimensionKeys: ["integration_fit"],
  },
  {
    category: "execution",
    priority: "P2",
    question:
      "Describe pharmacist staffing, credentialing, cross-training, and backup coverage for after-hours and holiday operations.",
    whyItMatters: "24/7 staffing is a stated requirement; staffing gaps are Interview failure modes.",
    riskIfUnanswered: "Staffing gaps undermine delivery and Risk credibility.",
    linkedFitDimensionKeys: ["delivery_operations"],
  },
  {
    category: "pricing",
    priority: "P2",
    question:
      "What hidden costs or assumptions are not visible in the price sheet line items (e.g., travel, third-party fees, change orders)?",
    whyItMatters: "Surprise costs are a classic award protest theme.",
    riskIfUnanswered: "Commercial risk under oral questioning.",
    linkedFitDimensionKeys: ["risk_posture"],
  },
  {
    category: "risk",
    priority: "P2",
    question:
      "What is your business continuity plan if a key subcontractor or data center partner exits the relationship mid-term?",
    whyItMatters: "Continuity is a risk scoring and contract theme.",
    riskIfUnanswered: "Risk narrative may be incomplete.",
    linkedFitDimensionKeys: ["risk_posture"],
  },
  {
    category: "truth_test",
    priority: "P2",
    question:
      "Where have your implementations slipped or failed in the last five years, and what changed in your operating model as a result?",
    whyItMatters: "Evaluators reward honesty; evasive answers hurt Interview.",
    riskIfUnanswered: "Credibility gap under adversarial Q&A.",
    linkedFitDimensionKeys: ["references_proof"],
  },
  {
    category: "capability",
    priority: "P2",
    question:
      "How do you handle prior authorization, Medicaid billing edits, and coordination with facility nursing for medication changes?",
    whyItMatters: "Core service delivery for HDCs; must align to RFP.",
    riskIfUnanswered: "Clinical/billing workflow gaps surface under Solution scoring.",
    linkedFitDimensionKeys: ["technical_capability"],
    linkedRequirementPatterns: ["Medicaid", "prior authorization"],
  },
  {
    category: "integration",
    priority: "P3",
    question:
      "What APIs or batch interfaces are available today for claims, eligibility, and clinical data feeds relevant to this contract?",
    whyItMatters: "Technical depth for Solution appendix and architecture alignment.",
    riskIfUnanswered: "Integration depth remains unclear for architecture alignment.",
    linkedFitDimensionKeys: ["integration_fit"],
  },
  {
    category: "execution",
    priority: "P3",
    question:
      "What project management and governance cadence do you propose with DHS and Malone during the first 120 days?",
    whyItMatters: "Supports disciplined transition narrative.",
    riskIfUnanswered: "Weak governance narrative for transition and risk.",
    linkedFitDimensionKeys: ["delivery_operations"],
  },
  {
    category: "differentiation",
    priority: "P3",
    question:
      "What innovation or quality program (e.g., clinical pharmacy, medication therapy management) can you bring to HDCs beyond baseline requirements?",
    whyItMatters: "Optional differentiation for Solution/Interview.",
    riskIfUnanswered: "Missed differentiation opportunity — not a blocker.",
    linkedFitDimensionKeys: ["technical_capability"],
  },
  {
    category: "proof",
    priority: "P3",
    question:
      "Can you provide a redacted example of a monthly operational report or KPI dashboard you provide to clients?",
    whyItMatters: "Tangible proof for Experience.",
    riskIfUnanswered: "Experience proof remains anecdotal.",
    linkedFitDimensionKeys: ["references_proof"],
  },
  {
    category: "truth_test",
    priority: "P3",
    question:
      "What would cause you to decline or exit this contract — hard limits or constraints we should know now?",
    whyItMatters: "Surfaces deal-breakers early.",
    riskIfUnanswered: "Hidden exit constraints may surface late.",
    linkedFitDimensionKeys: ["risk_posture"],
  },
  {
    category: "stack_role",
    priority: "P3",
    question:
      "How do you coordinate with packaging, labeling, and courier vendors in the proposed stack without duplicating accountability?",
    whyItMatters: "Integration of operational handoffs.",
    riskIfUnanswered: "Ambiguous handoffs increase operational risk.",
    linkedFitDimensionKeys: ["integration_fit"],
  },
  {
    category: "risk",
    priority: "P3",
    question:
      "What regulatory or Medicaid changes in Arkansas are you most concerned about in the next 24 months, and how do you absorb them?",
    whyItMatters: "Forward-looking risk posture.",
    riskIfUnanswered: "Regulatory foresight gap in Risk narrative.",
    linkedFitDimensionKeys: ["risk_posture"],
  },
  {
    category: "pricing",
    priority: "P3",
    question:
      "How do you structure annual price adjustments or escalators, and what approval path exists with the State?",
    whyItMatters: "Long-term commercial clarity.",
    riskIfUnanswered: "Escalator path unclear — commercial uncertainty.",
    linkedFitDimensionKeys: ["risk_posture"],
  },
];

export function fillFrameworkVars(
  text: string,
  vars: { vendorName: string; stackHint: string },
): string {
  return text
    .replaceAll("{vendorName}", vars.vendorName)
    .replaceAll("{stackHint}", vars.stackHint);
}
