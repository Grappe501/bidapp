/**
 * Executable system definition for vendor intelligence (principles, pipeline,
 * dimensions, scoring, discovery, interview rules). Structured — not prose.
 */

export const VENDOR_INTELLIGENCE_PRINCIPLES = [
  {
    id: "provenance_first",
    label: "Provenance first",
    rule: "Every scored or drafted claim must trace to a stored source, claim row, or explicit gap.",
  },
  {
    id: "no_invented_facts",
    label: "No invented vendor facts",
    rule: "Models may structure and compare; they must not fabricate certifications, metrics, or customer names.",
  },
  {
    id: "confidence_weighted",
    label: "Confidence-weighted synthesis",
    rule: "Lower-confidence evidence is down-weighted in scoring and called out in interview prep.",
  },
  {
    id: "rfp_and_arch_alignment",
    label: "RFP + architecture alignment",
    rule: "Fit compares solicitation requirements and proposed stack roles to vendor evidence.",
  },
] as const;

export type VendorPipelineStageId =
  | "query_plan"
  | "search"
  | "ingest"
  | "enrich"
  | "facet_extract"
  | "persist";

export const VENDOR_INTELLIGENCE_PIPELINE: readonly {
  stage: VendorPipelineStageId;
  description: string;
  outputs: string[];
}[] = [
  {
    stage: "query_plan",
    description: "Derive vendor- and project-scoped search queries",
    outputs: ["query_strings"],
  },
  {
    stage: "search",
    description: "Execute web search API when configured; collect ranked URLs",
    outputs: ["urls"],
  },
  {
    stage: "ingest",
    description: "Fetch top URLs into intelligence_sources with vendor metadata",
    outputs: ["intelligence_sources"],
  },
  {
    stage: "enrich",
    description: "LLM extraction of claims and facts from stored text (same policy as company enrichment)",
    outputs: ["vendor_claims", "intelligence_facts"],
  },
  {
    stage: "facet_extract",
    description: "Structured extraction of performance / integration / risk facets",
    outputs: ["tagged_intelligence_facts"],
  },
  {
    stage: "persist",
    description: "Write research run record and link sources to vendor",
    outputs: ["vendor_research_runs"],
  },
] as const;

export const VENDOR_FIT_DIMENSIONS: readonly {
  key: string;
  label: string;
  description: string;
}[] = [
  {
    key: "technical_capability",
    label: "Technical capability",
    description: "Meets functional/technical requirements with credible evidence.",
  },
  {
    key: "integration_fit",
    label: "Integration fit",
    description: "APIs, interfaces, and workflow fit with proposed architecture.",
  },
  {
    key: "delivery_operations",
    label: "Delivery & operations",
    description: "Implementation, staffing, SLA, and service delivery alignment.",
  },
  {
    key: "risk_posture",
    label: "Risk posture",
    description: "Security, compliance, dependency, and operational risk signals.",
  },
  {
    key: "references_proof",
    label: "References & proof",
    description: "Past performance, pilots, and substantiation quality.",
  },
] as const;

export type VendorScorePillarKey =
  | "technical"
  | "integration"
  | "delivery"
  | "risk"
  | "references";

export const VENDOR_SCORING_MODEL: {
  pillars: readonly {
    key: VendorScorePillarKey;
    weight: number;
    mapsToFitDimensions: string[];
  }[];
  /** Display: avoid false precision — scores are banded 1–5. */
  outputBand: "1_to_5";
} = {
  pillars: [
    {
      key: "technical",
      weight: 0.28,
      mapsToFitDimensions: ["technical_capability"],
    },
    {
      key: "integration",
      weight: 0.24,
      mapsToFitDimensions: ["integration_fit"],
    },
    {
      key: "delivery",
      weight: 0.2,
      mapsToFitDimensions: ["delivery_operations"],
    },
    {
      key: "risk",
      weight: 0.18,
      mapsToFitDimensions: ["risk_posture"],
    },
    {
      key: "references",
      weight: 0.1,
      mapsToFitDimensions: ["references_proof"],
    },
  ],
  outputBand: "1_to_5",
};

export const VENDOR_DISCOVERY_MODEL: {
  /** How candidate rows are produced in v1 */
  source: "web_search_organic";
  statuses: readonly string[];
} = {
  source: "web_search_organic",
  statuses: ["new", "dismissed", "promoted"],
};

export const VENDOR_INTERVIEW_GENERATION_RULES: {
  mustAsk: { trigger: string; template: string }[];
  proveIt: { trigger: string; template: string }[];
  risk: { trigger: string; template: string }[];
} = {
  mustAsk: [
    {
      trigger: "gap_in_integration_fit",
      template:
        "Walk through end-to-end data flow for {integration_touchpoint} and name your responsibilities vs ours.",
    },
    {
      trigger: "gap_in_technical_capability",
      template:
        "Which RFP requirements are fully covered in your standard offering vs require custom work for this program?",
    },
  ],
  proveIt: [
    {
      trigger: "low_confidence_claim",
      template:
        "Provide a redacted example or reference for: {claim_summary} (source allowed in room).",
    },
    {
      trigger: "unverified_vendor_claim",
      template:
        "What evidence can you share in writing within 48 hours to substantiate: {claim_summary}?",
    },
  ],
  risk: [
    {
      trigger: "risk_facet_or_stored_risk",
      template:
        "What is your mitigation plan for {risk_summary}, and how will we measure success in the first 90 days?",
    },
  ],
};
