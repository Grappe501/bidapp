import type { TechnicalProposalPacketModel } from "@/types/technical-proposal-packet";

/**
 * Structured Technical Proposal Packet for S000000479 — response blueprint for drafting,
 * submission checklist, and output packaging (aligned to state packet instructions).
 */
export const CANONICAL_TECHNICAL_PROPOSAL_PACKET_S000000479: TechnicalProposalPacketModel =
  {
    solicitationNumber: "S000000479",
    title:
      "Technical Proposal Packet — Pharmacy Services for Human Development Centers (HDCs)",
    /** Matches state “Submission Requirements Checklist” (Technical Proposal Packet .docx). */
    requiredSubmissionItems: [
      "Proposal Signature Page",
      "Proposed Subcontractors Form",
      "Recommended Options Form",
      "S000000479 Minimum RFP Requirements",
      "Information for Evaluation — Experience (2 pages or less)",
      "Information for Evaluation — Solution (2 pages or less)",
      "Information for Evaluation — Risk (2 pages or less)",
      "Copy of Prospective Contractor's Equal Opportunity Policy",
      "Completed Official Solicitation Price Sheet",
    ],
    preAwardItems: ["EO 98-04: Contract and Grant Disclosure Form"],
    ifApplicableItems: [
      "Voluntary Product Accessibility Template (VPAT)",
      "Redacted copy of the submission documents",
    ],
    pageLimits: {
      experience: 2,
      solution: 2,
      risk: 2,
    },
    draftingConstraints: {
      noExternalLinks: true,
      claimDocumentedPerformancePattern: true,
      riskSolutionDocumentedPerformancePattern: true,
    },
    forms: {
      signaturePage: true,
      subcontractorForm: true,
      recommendedOptionsForm: true,
      minimumRequirementsCertification: true,
    },
  };

/** Block injected into OpenAI drafting prompts (first-class blueprint). */
export function formatTechnicalProposalPacketBlockForPrompt(): string {
  const p = CANONICAL_TECHNICAL_PROPOSAL_PACKET_S000000479;
  return [
    "══ TECHNICAL PROPOSAL PACKET (STATE BLUEPRINT — NON-OPTIONAL) ══",
    `Solicitation: ${p.solicitationNumber} — ${p.title}`,
    "",
    "REQUIRED SUBMISSION COMPONENTS (state checklist):",
    ...p.requiredSubmissionItems.map((x) => `  • ${x}`),
    "",
    "MAY BE INCLUDED WITH PROPOSAL — PRIOR TO CONTRACT AWARD:",
    ...p.preAwardItems.map((x) => `  • ${x}`),
    "",
    "IF APPLICABLE (submit with proposal when applicable):",
    ...p.ifApplicableItems.map((x) => `  • ${x}`),
    "",
    `PAGE LIMITS (hard): Experience ${p.pageLimits.experience} pages, Solution ${p.pageLimits.solution} pages, Risk ${p.pageLimits.risk} pages.`,
    "",
    "NO LINKS (verbatim risk from packet): Do not include links to outside sources in Experience, Solution, or Risk volumes. Links may be redacted or removed and may cause rejection. See RFP Section 3.5.",
    "",
    "EXPERIENCE — INFORMATION FOR EVALUATION: Prioritize most important experience first. Use repeating blocks:",
    "  Claim of Expertise: (assertion of capability)",
    "  Documented Performance: (evidence — metrics, references, outcomes)",
    "",
    "SOLUTION — INFORMATION FOR EVALUATION: Narrative high-level overview of the solution/approach per Solicitation requirements. No links.",
    "",
    "RISK — INFORMATION FOR EVALUATION: Identify and prioritize major risks; for each:",
    "  Risk Description → Solution (mitigation) → Documented Performance (or verifiable outcome). No links.",
    "",
    "DRAFTING CONSTRAINTS:",
    `- No hyperlinks in scored volumes: ${p.draftingConstraints.noExternalLinks ? "mandatory" : "N/A"}`,
    `- Experience structure: ${p.draftingConstraints.claimDocumentedPerformancePattern ? "Claim of Expertise / Documented Performance blocks" : ""}`,
    `- Risk structure: ${p.draftingConstraints.riskSolutionDocumentedPerformancePattern ? "Risk Description / Solution / Documented Performance" : ""}`,
    "══ END TECHNICAL PROPOSAL PACKET ══",
  ]
    .filter((line) => line !== "")
    .join("\n");
}
