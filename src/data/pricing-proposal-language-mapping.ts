import type { PricingCategory } from "../types/pricing-model";

/**
 * Master mapping: price-sheet concepts → scored proposal language (AllCare / HDC pharmacy).
 * Used by drafting prompts and submission-package exports — not a substitute for verified numbers.
 */

export const PRICING_SUMMARY_NARRATIVE_BLOCK = `AllCare's pricing model is designed to provide a transparent, predictable, and fully integrated cost structure aligned with the State's operational and compliance requirements.

Rather than separating services into fragmented line items, AllCare consolidates dispensing, packaging, clinical services, delivery, billing, and technology integration into a coordinated model that:
- reduces administrative complexity,
- improves service reliability,
- and minimizes hidden or variable costs.

This approach ensures that pricing directly reflects the full scope of required services while maintaining cost stability over the life of the contract.`;

export const PRICING_NARRATIVE_ANTIPATTERNS = [
  "Do not list prices without explanation.",
  "Do not separate everything into add-ons when the model is integrated.",
  "Do not ignore high-risk cost areas (delivery, compliance).",
  "Do not leave pricing disconnected from RFP requirements.",
];

export const PRICING_SCORING_BRIDGE = `Scoring alignment: Solution (pricing narrative), Risk (cost uncertainty / volatility), and Interview (oral defense of the model) all improve when line items are translated into requirement-tied value and risk reduction — not raw tables alone.`;

type CategoryNarrative = {
  title: string;
  pricingLineExamples: string[];
  proposalLanguage: string;
  coaching: string;
};

/** Keys align to {@link PricingCategory}; packaging narrative pairs with dispensing lines. */
export const PRICING_CATEGORY_NARRATIVE: Record<
  PricingCategory,
  CategoryNarrative
> = {
  dispensing: {
    title: "Dispensing (core revenue driver)",
    pricingLineExamples: [
      "Per-fill dispensing fee",
      "Cycle fill pricing",
      "Packaging included",
    ],
    proposalLanguage: `AllCare's dispensing model is structured around a predictable, cycle-based approach that aligns with the State's requirement for 30-day medication management.

Pricing is based on a per-fill structure that incorporates:
- standardized dispensing workflows,
- pharmacist verification,
- and integrated packaging services.

By consolidating dispensing, packaging, and verification into a single operational flow, AllCare reduces duplication of effort and minimizes medication errors, resulting in both cost efficiency and improved clinical outcomes.`,
    coaching:
      "Justify cost; tie to RFP (e.g., cycle/coverage); reduce perceived operational risk.",
  },
  delivery: {
    title: "Emergency delivery (high-risk item)",
    pricingLineExamples: ["Emergency delivery", "STAT delivery"],
    proposalLanguage: `AllCare's pricing includes support for emergency medication delivery within the State's required two-hour response window.

Rather than treating emergency delivery as an unpredictable surcharge, AllCare incorporates this capability into its operational infrastructure through:
- regional logistics coverage,
- on-call pharmacy coordination,
- and pre-positioned inventory strategies.

This model ensures compliance with critical response requirements while avoiding excessive per-incident billing variability.`,
    coaching:
      "Reduce cost volatility; address RFP response requirements; show operational maturity.",
  },
  clinical_services: {
    title: "Clinical / pharmacist services",
    pricingLineExamples: [
      "Pharmacist oversight",
      "Clinical support",
      "Prior authorization",
    ],
    proposalLanguage: `Clinical pharmacy services, including pharmacist oversight and prior authorization support, are integrated into AllCare's core pricing structure.

This ensures that:
- medication regimens are actively managed,
- prior authorizations are processed efficiently,
- and compliance with Medicaid and regulatory requirements is maintained.

By embedding clinical services into the base model, AllCare eliminates delays and reduces downstream administrative burden on facility staff.`,
    coaching:
      "Justify cost; tie to Medicaid/regulatory expectations; emphasize reduced admin burden for the State and facilities.",
  },
  compliance_admin: {
    title: "Billing, Medicaid, admin & compliance",
    pricingLineExamples: [
      "Billing services",
      "Claims handling",
      "Reporting",
      "Compliance tracking",
    ],
    proposalLanguage: `AllCare's pricing model incorporates full-service billing and claims management, with specific alignment to Medicaid requirements.

This includes:
- real-time claims processing,
- prior authorization coordination,
- and reconciliation support.

By integrating billing into the pharmacy service model, AllCare reduces claim denials, accelerates reimbursement cycles, and minimizes administrative overhead for the State.

Administrative and compliance support, including reporting and audit readiness, are included within AllCare's pricing structure. This ensures that required reports are delivered consistently, audit requirements are met, and compliance risks are minimized. AllCare's model emphasizes proactive compliance management rather than reactive correction, reducing both risk and administrative burden.`,
    coaching:
      "Frame billing as cash flow, compliance strength, and admin reduction; keep compliance/reporting inside the integrated model.",
  },
  technology: {
    title: "Technology / EHR integration (e.g., MatrixCare)",
    pricingLineExamples: ["Integration costs", "Interface support"],
    proposalLanguage: `AllCare's pricing includes support for integration with the State's MatrixCare system, including both real-time and batch interface capabilities.

This integration enables:
- accurate medication records,
- seamless communication between pharmacy and facility systems,
- and improved auditability of medication administration.

By including integration within the service model, AllCare ensures that technology requirements are met without introducing separate or hidden costs.`,
    coaching:
      "Match RFP integration expectations; justify tech cost; eliminate hidden-fee concern.",
  },
};

/** Blister / unit-dose packaging — often booked under dispensing; use when packaging lines are present. */
export const PACKAGING_NARRATIVE_SUPPLEMENT: CategoryNarrative = {
  title: "Blister packaging / medication management",
  pricingLineExamples: [
    "Packaging cost (per patient / per cycle)",
    "Blister or unit-dose packaging",
  ],
  proposalLanguage: `Blister packaging is included as a standard component of AllCare's service model rather than a separate add-on.

This approach ensures:
- improved medication adherence,
- reduced administration errors,
- and streamlined nursing workflows within HDC facilities.

By embedding packaging into the base dispensing model, AllCare avoids fragmented billing structures and provides a more predictable and transparent cost profile.`,
  coaching:
    "Turn cost into safety, efficiency, and transparency — not a standalone surcharge narrative.",
};

function hasPackagingLine(signal: string): boolean {
  return /packag|blister|unit[\s-]*dose|medication\s+management/i.test(signal);
}

/**
 * Builds prompt text: category narratives relevant to the pricing model + global summary and guardrails.
 */
export function formatPricingNarrativeMappingForPrompt(input: {
  /** Category labels from structured line items */
  categoriesPresent: Set<string>;
  /** Optional: line names joined for packaging detection */
  lineNamesJoined?: string;
}): string {
  const lines = input.lineNamesJoined ?? "";
  const parts: string[] = [
    "MASTER MAPPING — PRICE SHEET → PROPOSAL LANGUAGE (AllCare)",
    "Use this to translate structured pricing into scored narrative. Do not invent dollar amounts beyond STRUCTURED PRICING JSON. Adapt tone to the section type (Solution vs Risk vs Executive).",
    "",
  ];

  const order: PricingCategory[] = [
    "dispensing",
    "delivery",
    "clinical_services",
    "compliance_admin",
    "technology",
  ];

  for (const cat of order) {
    if (!input.categoriesPresent.has(cat)) continue;
    const block = PRICING_CATEGORY_NARRATIVE[cat];
    parts.push(`--- ${block.title} ---`);
    parts.push(`Example pricing lines: ${block.pricingLineExamples.join("; ")}`);
    parts.push(block.proposalLanguage);
    parts.push(`Coach: ${block.coaching}`);
    parts.push("");
  }

  if (hasPackagingLine(lines) || input.categoriesPresent.has("dispensing")) {
    const p = PACKAGING_NARRATIVE_SUPPLEMENT;
    parts.push(`--- ${p.title} (use when packaging is in scope) ---`);
    parts.push(p.proposalLanguage);
    parts.push(`Coach: ${p.coaching}`);
    parts.push("");
  }

  parts.push("--- PRICING SUMMARY LANGUAGE (integrate where appropriate) ---");
  parts.push(PRICING_SUMMARY_NARRATIVE_BLOCK);
  parts.push("");
  parts.push("--- DO NOT (loses evaluators) ---");
  parts.push(PRICING_NARRATIVE_ANTIPATTERNS.map((x) => `- ${x}`).join("\n"));
  parts.push("");
  parts.push(PRICING_SCORING_BRIDGE);

  return parts.join("\n");
}

/** Short addendum after numeric pricing summary (clipboard / submission package). */
export function formatPricingCompactNarrativeAppendix(): string {
  return [
    "",
    "— PROPOSAL NARRATIVE (summary — align to Solution / Risk / interview) —",
    "",
    PRICING_SUMMARY_NARRATIVE_BLOCK,
    "",
    "Avoid:",
    ...PRICING_NARRATIVE_ANTIPATTERNS.map((x) => `  • ${x}`),
    "",
    PRICING_SCORING_BRIDGE,
  ].join("\n");
}

/**
 * Full category narratives for offline reference (optional longer export).
 */
export function formatPricingFullNarrativeExportAppendix(): string {
  const lines = [
    "",
    "— FULL MASTER MAPPING (price sheet → proposal language) —",
    "",
    ...Object.values(PRICING_CATEGORY_NARRATIVE).flatMap((b) => [
      `[${b.title}]`,
      b.proposalLanguage,
      "",
    ]),
    `[${PACKAGING_NARRATIVE_SUPPLEMENT.title}]`,
    PACKAGING_NARRATIVE_SUPPLEMENT.proposalLanguage,
    "",
    PRICING_SUMMARY_NARRATIVE_BLOCK,
    "",
    "Avoid:",
    ...PRICING_NARRATIVE_ANTIPATTERNS.map((x) => `  • ${x}`),
    "",
    PRICING_SCORING_BRIDGE,
  ];
  return lines.join("\n");
}
