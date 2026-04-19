import { S000000479_BID_NUMBER } from "./canonical-rfp-s000000479";

export { S000000479_BID_NUMBER };

/** Differentiation one-pager — scoring-aligned, no fluff; reinforces volumes + exec summary. */
export const CANONICAL_WHY_ALLCARE_WINS_TITLE = "Why AllCare Wins";

export const CANONICAL_WHY_ALLCARE_WINS_SUBTITLE =
  "Pharmacy Services for DHS Human Development Centers (S000000479)";

export const CANONICAL_WHY_ALLCARE_WINS_BODY = `AllCare Pharmacy delivers a pharmacy services solution that is operationally integrated, clinically driven, and contract-ready from day one. Our approach is designed specifically to meet the State's requirements for reliability, compliance, and long-term performance across all Human Development Centers.

1. Fully Integrated Service Model

AllCare provides a single, coordinated system that combines dispensing, packaging, delivery, clinical services, billing, and technology integration into one operational framework.

This eliminates fragmented services, reduces administrative burden, and ensures consistent performance across all facilities. The State works with one accountable partner rather than managing multiple disconnected functions.

2. Built-In Compliance with Critical Requirements

AllCare's solution is structured to meet the most demanding elements of the RFP as standard operations:

24/7 pharmacy service coverage
Two-hour emergency medication delivery
30-day cycle dispensing
Blister packaging for accuracy and adherence
Medicaid billing and prior authorization support
MatrixCare system integration

These capabilities are embedded into our core service model, not offered as optional or add-on services.

3. Risk Mitigation Designed into Operations

AllCare proactively addresses the highest-risk areas of this contract:

Emergency response is supported through coordinated logistics and inventory strategy
Continuous service is ensured through structured staffing and on-call coverage
System integration is planned and validated early in implementation
Billing and compliance are managed within the pharmacy workflow

By embedding risk mitigation into daily operations, AllCare reduces the likelihood of service disruption and ensures consistent contract performance.

4. Transparent, Predictable Pricing Model

AllCare's pricing reflects the full scope of required services through an integrated structure rather than fragmented line items.

Dispensing, packaging, delivery, clinical services, billing, and technology integration are combined into a coordinated model that:

reduces administrative complexity
eliminates hidden or variable costs
supports long-term cost stability

This approach aligns directly with contract requirements and provides the State with a clear and reliable financial structure.

5. Clinical Oversight and Patient Safety Focus

AllCare integrates pharmacist oversight into every stage of medication management.

This ensures:

accurate dispensing and packaging
proactive management of medication regimens
efficient prior authorization processing
reduced risk of medication errors

Our model prioritizes patient safety and supports improved clinical outcomes across all facilities.

6. Technology-Enabled Operations

AllCare supports seamless integration with the State's MatrixCare system, enabling:

real-time and batch data exchange
accurate medication records
improved auditability and reporting

Technology is incorporated as part of the service model, ensuring compliance without added complexity or cost.

7. Contract-Ready and Performance-Aligned

AllCare's solution is structured to align directly with SRV-1 contract requirements, including:

clearly defined service scope
measurable performance expectations
structured pricing tied to service delivery

This ensures that the proposed solution can transition directly into contract execution without rework or ambiguity.

8. Proven Partner for Long-Term Performance

AllCare's approach is designed not only to meet immediate requirements but to sustain performance over the full contract term.

By combining operational consistency, integrated services, and proactive risk management, AllCare provides a stable and scalable solution that supports the State's long-term objectives.

Conclusion

AllCare Pharmacy offers more than a compliant proposal. We deliver a complete, integrated pharmacy services solution that aligns with the State's operational needs, reduces risk, and provides a clear, sustainable path for long-term success.`;

export const CANONICAL_WHY_ALLCARE_WINS_WHY_WORKS = [
  "Reinforces Solution, Risk, and Executive Summary without repeating them verbatim.",
  "Maps cleanly to scoring categories (Experience, Solution, Risk, Interview, Cost).",
  "Gives evaluators a single mental model for internal justification.",
];

/** Optional: strategy / oral-prep prompts; no dollar figures — qualitative differentiation only. */
export function formatCanonicalWhyAllcareWinsForPrompt(): string {
  return [
    "WHY ALLCARE WINS — CANONICAL DIFFERENTIATION (S000000479)",
    "Use for clarity, confidence, and scoring alignment. No fluff; no invented metrics. Pricing: qualitative only unless from structured pricing JSON elsewhere.",
    "",
    CANONICAL_WHY_ALLCARE_WINS_TITLE,
    CANONICAL_WHY_ALLCARE_WINS_SUBTITLE,
    "",
    CANONICAL_WHY_ALLCARE_WINS_BODY,
    "",
    "Why this page works:",
    ...CANONICAL_WHY_ALLCARE_WINS_WHY_WORKS.map((x) => `- ${x}`),
  ].join("\n");
}
