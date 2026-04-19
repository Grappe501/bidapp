import { S000000479_BID_NUMBER } from "./canonical-rfp-s000000479";

export { S000000479_BID_NUMBER };

/** Single-page tone-setter — aligns Solution, Risk, Interview; pricing strategy without dollar amounts. */
export const CANONICAL_EXECUTIVE_SUMMARY_S000000479_TITLE =
  "Executive Summary — Pharmacy Services for DHS Human Development Centers";

export const CANONICAL_EXECUTIVE_SUMMARY_S000000479_BODY = `AllCare Pharmacy proposes a fully integrated pharmacy services solution designed to meet the operational, clinical, and regulatory requirements of the Department of Human Services' Human Development Centers (HDCs). This solution is built to provide reliable, compliant, and efficient medication management across all facilities while supporting long-term contract performance.

At the core of AllCare's approach is a unified service model that integrates dispensing, packaging, delivery, clinical oversight, billing, and technology into a coordinated system. This eliminates the fragmentation commonly associated with pharmacy services and ensures that all components of care operate consistently and predictably. By consolidating these functions, AllCare reduces administrative burden on facility staff while improving service reliability and patient outcomes.

AllCare's dispensing model is structured around a cycle-based approach aligned with the State's requirement for 30-day medication management. Blister packaging is included as a standard component of this model, improving medication accuracy and adherence while simplifying administration within HDC facilities. This integrated approach reduces the risk of medication errors and supports consistent care delivery.

A key strength of AllCare's solution is its ability to meet the State's critical service requirements, including continuous 24/7 support and two-hour emergency medication delivery. These capabilities are embedded within AllCare's operational infrastructure rather than treated as add-on services, ensuring consistent performance without introducing cost variability or service delays.

AllCare's clinical services are fully integrated into the pharmacy model, providing ongoing pharmacist oversight, proactive prior authorization management, and alignment with Medicaid requirements. This ensures that medication regimens are managed effectively while reducing administrative burden and improving responsiveness to resident needs.

Technology integration is also a central component of the solution. AllCare supports integration with the State's MatrixCare system, enabling accurate medication records, seamless communication between pharmacy and facility systems, and improved auditability. This integration is included within the service model, ensuring that technology requirements are met without additional complexity or hidden costs.

From a financial perspective, AllCare's pricing model is designed to be transparent, predictable, and fully aligned with the scope of required services. By integrating dispensing, packaging, delivery, clinical services, billing, and technology into a single coordinated structure, AllCare minimizes fragmented billing and reduces the risk of unexpected costs. This approach provides the State with a stable and clearly defined cost model over the life of the contract.

AllCare's solution is also designed to mitigate the key risks identified in the RFP. Emergency delivery, service continuity, system integration, and billing compliance are addressed through structured processes and embedded within the operational model. This proactive approach reduces the likelihood of service disruption and supports consistent contract performance.

Ultimately, AllCare offers a pharmacy services solution that is not only compliant with the State's requirements but intentionally designed for reliability, scalability, and long-term partnership. By aligning operational execution, clinical oversight, technology integration, and pricing into a unified system, AllCare provides the State with a solution that is both practical and sustainable.`;

export const CANONICAL_EXECUTIVE_SUMMARY_S000000479_WHY_WORKS = [
  "Mirrors Solution and reinforces consistency (trust).",
  "Reinforces Risk posture (confidence, lower evaluator anxiety).",
  "Defends pricing strategy without listing numbers; aligns with SRV-1 scope and performance.",
  "Answers \"why this vendor\" immediately — ~2-minute read.",
];

export function formatCanonicalExecutiveSummaryForPrompt(): string {
  return [
    "CANONICAL EXECUTIVE SUMMARY REFERENCE (S000000479 — AllCare)",
    "Use for ONE-PAGE discipline, TONE, and EVALUATOR CONFIDENCE. Must align with Solution, Risk, and Interview volumes; reflect pricing strategy qualitatively only (no invented dollar amounts — structured pricing JSON is separate).",
    "",
    CANONICAL_EXECUTIVE_SUMMARY_S000000479_TITLE,
    "",
    CANONICAL_EXECUTIVE_SUMMARY_S000000479_BODY,
    "",
    "Why this works (coaching):",
    ...CANONICAL_EXECUTIVE_SUMMARY_S000000479_WHY_WORKS.map((x) => `- ${x}`),
  ].join("\n");
}
