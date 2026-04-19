/**
 * S479 / Malone-oriented failure scenarios — keys stable for DB + UI.
 * v1: heuristic evaluation only; labels express uncertainty.
 */

export type FailureModeCategory =
  | "delivery"
  | "integration"
  | "implementation"
  | "staffing"
  | "compliance"
  | "security"
  | "billing"
  | "support"
  | "data"
  | "commercial"
  | "dependency"
  | "other";

export type StressFamily =
  | "delivery"
  | "integration"
  | "implementation"
  | "compliance_security"
  | "commercial_dependency"
  | "all";

export type LikelihoodBand = "low" | "medium" | "high";
export type ImpactBand = "low" | "medium" | "high" | "critical";
export type RecoverabilityBand = "easy" | "moderate" | "hard" | "uncertain";
export type PreparednessBand = "strong" | "adequate" | "weak" | "unknown";
export type EvidenceStrengthBand = "strong" | "moderate" | "weak" | "none";

export type FailureScenarioDefinition = {
  key: string;
  category: FailureModeCategory;
  stressFamily: StressFamily;
  title: string;
  description: string;
  /** Default impact if evidence sparse */
  baseImpact: ImpactBand;
  /** Optional claim-validation keys that anchor this scenario */
  relatedClaimKeys?: string[];
  /** Corpus / fact hints that suggest mitigation */
  mitigationHints: RegExp[];
  /** Corpus / fact hints that increase stress */
  stressHints: RegExp[];
};

export const FAILURE_SCENARIO_TAXONOMY_V1: FailureScenarioDefinition[] = [
  {
    key: "delivery.emergency_two_hour_miss",
    category: "delivery",
    stressFamily: "delivery",
    title: "Emergency / stat delivery window miss",
    description:
      "Two-hour or urgent medication delivery fails to meet contractual window under load or routing stress.",
    baseImpact: "critical",
    relatedClaimKeys: ["delivery.two_hour_emergency"],
    mitigationHints: [/backup|redundant|courier|escalation|spare|after[\s-]?hours/i],
    stressHints: [/delay|missed|late|capacity|weather|traffic/i],
  },
  {
    key: "delivery.after_hours_support_gap",
    category: "delivery",
    stressFamily: "delivery",
    title: "After-hours pharmacy coverage gap",
    description:
      "24/7 or on-call coverage proves thin when volume spikes or key staff unavailable.",
    baseImpact: "high",
    relatedClaimKeys: ["delivery.24_7_support"],
    mitigationHints: [/24\s*[/\s]*7|on[\s-]?call|cross[\s-]?train|relief/i],
    stressHints: [/limited\s+hours|business\s+hours|voicemail|callback/i],
  },
  {
    key: "delivery.weather_or_transport_disruption",
    category: "delivery",
    stressFamily: "delivery",
    title: "Weather / transport disruption",
    description:
      "Severe weather or logistics disruption breaks SLA without credible contingency.",
    baseImpact: "medium",
    mitigationHints: [/contingency|alternate|regional|stock|buffer/i],
    stressHints: [/single\s+route|no\s+backup/i],
  },
  {
    key: "integration.matrixcare_interface_delay",
    category: "integration",
    stressFamily: "integration",
    title: "MatrixCare interface delay or fragility",
    description:
      "Direct or certified MatrixCare touchpoints slip schedule or fail under production load.",
    baseImpact: "high",
    relatedClaimKeys: ["integration.matrixcare"],
    mitigationHints: [/certif|live|production|hl7|fhir|monitor/i],
    stressHints: [/middleware|custom|roadmap|pilot|unknown/i],
  },
  {
    key: "integration.bidirectional_sync_failure",
    category: "integration",
    stressFamily: "integration",
    title: "Bidirectional order / status sync failure",
    description:
      "Orders or status updates desync between pharmacy ops and facility EHR workflows.",
    baseImpact: "high",
    relatedClaimKeys: ["integration.bidirectional_interface"],
    mitigationHints: [/reconcil|audit|sync|queue|retry/i],
    stressHints: [/batch\s+only|one[\s-]?way|manual/i],
  },
  {
    key: "integration.batch_vs_real_time_mismatch",
    category: "integration",
    stressFamily: "integration",
    title: "Batch vs real-time expectation mismatch",
    description:
      "Facility expects near-real-time updates but vendor stack is batch-heavy.",
    baseImpact: "medium",
    relatedClaimKeys: ["integration.real_time_batch"],
    mitigationHints: [/real[\s-]?time|latency|sla/i],
    stressHints: [/batch|nightly|csv|upload/i],
  },
  {
    key: "implementation.six_month_go_live_miss",
    category: "implementation",
    stressFamily: "implementation",
    title: "Six-month go-live schedule slip",
    description:
      "Phased rollout or go-live misses contractual or eval-critical milestones.",
    baseImpact: "high",
    relatedClaimKeys: ["implementation.six_month_go_live"],
    mitigationHints: [/milestone|gantt|owner|cutover|runbook/i],
    stressHints: [/delay|slip|resource|dependency/i],
  },
  {
    key: "implementation.staffing_ramp_failure",
    category: "implementation",
    stressFamily: "implementation",
    title: "Staffing ramp / credentialing failure",
    description:
      "Pharmacist or tech staffing cannot scale to contracted coverage on time.",
    baseImpact: "high",
    mitigationHints: [/recruit|credential|bench|float/i],
    stressHints: [/shortage|turnover|vacancy/i],
  },
  {
    key: "staffing.key_person_loss",
    category: "staffing",
    stressFamily: "implementation",
    title: "Key person / PM loss mid-implementation",
    description:
      "Single-threaded ownership — losing PM or clinical lead destabilizes delivery.",
    baseImpact: "medium",
    mitigationHints: [/succession|backup|deputy|playbook/i],
    stressHints: [/single|only|hero/i],
  },
  {
    key: "staffing.insufficient_24_7_coverage",
    category: "staffing",
    stressFamily: "delivery",
    title: "Insufficient 24/7 pharmacist / tech coverage",
    description:
      "Contracted coverage hours cannot be met under churn or geography.",
    baseImpact: "high",
    relatedClaimKeys: ["delivery.24_7_support"],
    mitigationHints: [/coverage\s+model|float|regional/i],
    stressHints: [/understaff|gap|call\s+out/i],
  },
  {
    key: "billing.medicaid_claim_denial_spike",
    category: "billing",
    stressFamily: "commercial_dependency",
    title: "Medicaid / payer claim denial spike",
    description:
      "Claims edits or coordination errors spike denials — cash-flow and service risk.",
    baseImpact: "high",
    relatedClaimKeys: ["billing.medicaid_expertise"],
    mitigationHints: [/denial\s+work|edi|clearing|appeal/i],
    stressHints: [/manual|spreadsheet|unverified/i],
  },
  {
    key: "billing.prior_auth_bottleneck",
    category: "billing",
    stressFamily: "commercial_dependency",
    title: "Prior authorization bottleneck",
    description:
      "PA workflow cannot keep pace — delays therapy starts and scores poorly on access.",
    baseImpact: "medium",
    relatedClaimKeys: ["clinical.prior_authorization"],
    mitigationHints: [/pa\s+team|workflow|automation/i],
    stressHints: [/backlog|queue|fax/i],
  },
  {
    key: "compliance.hipaa_hitech_breach_response",
    category: "compliance",
    stressFamily: "compliance_security",
    title: "HIPAA / HITECH incident response stress",
    description:
      "Breach or PHI exposure reveals weak logging, BAAs, or runbooks under scrutiny.",
    baseImpact: "critical",
    relatedClaimKeys: ["compliance.hipaa_hitech"],
    mitigationHints: [/breach|incident|logging|baa|training/i],
    stressHints: [/unknown|gap|untested/i],
  },
  {
    key: "compliance.audit_trail_gap",
    category: "compliance",
    stressFamily: "compliance_security",
    title: "Audit trail / documentation gap",
    description:
      "Agency audit cannot reconstruct decisions or dispensing trail across systems.",
    baseImpact: "high",
    mitigationHints: [/audit|immutable|retention|log/i],
    stressHints: [/ad[\s-]?hoc|email\s+only/i],
  },
  {
    key: "security.us_data_residency_violation_risk",
    category: "security",
    stressFamily: "compliance_security",
    title: "US data residency / sovereignty risk",
    description:
      "Hosting or subprocessors create residency or cross-border PHI exposure.",
    baseImpact: "high",
    relatedClaimKeys: ["security.us_data_residency"],
    mitigationHints: [/us[\s-]?hosted|domestic|region/i],
    stressHints: [/offshore|global|unknown\s+region/i],
  },
  {
    key: "support.project_manager_vacancy",
    category: "support",
    stressFamily: "implementation",
    title: "Dedicated PM / IM vacancy",
    description:
      "Implementation loses accountable owner — milestones and vendor coordination stall.",
    baseImpact: "medium",
    relatedClaimKeys: ["support.project_manager"],
    mitigationHints: [/pm|implementation\s+manager|cadence/i],
    stressHints: [/tbd|shared|fractional/i],
  },
  {
    key: "support.training_breakdown",
    category: "support",
    stressFamily: "implementation",
    title: "Training / change-management breakdown",
    description:
      "Facility staff cannot operate workflows — errors and rework spike post go-live.",
    baseImpact: "medium",
    relatedClaimKeys: ["support.monthly_training"],
    mitigationHints: [/train|super\s*user|champion/i],
    stressHints: [/minimal|one[\s-]?time|video\s+only/i],
  },
  {
    key: "dependency.malone_carrying_unplanned_load",
    category: "dependency",
    stressFamily: "commercial_dependency",
    title: "Malone absorbs unplanned integration / ops load",
    description:
      "Vendor gaps push middleware, coordination, or reporting burden to Malone beyond plan.",
    baseImpact: "high",
    mitigationHints: [/role|boundary|raci|sow/i],
    stressHints: [/malone|client\s+side|custom\s+build/i],
  },
  {
    key: "dependency.vendor_requires_custom_middleware",
    category: "dependency",
    stressFamily: "integration",
    title: "Vendor requires custom middleware / bridge",
    description:
      "No native interface — custom gateway adds latency, ownership fights, and failure surface.",
    baseImpact: "high",
    relatedClaimKeys: ["integration.matrixcare"],
    mitigationHints: [/native|certified|vendor\s+owned/i],
    stressHints: [/middleware|custom\s+gateway|vpn\s+only/i],
  },
  {
    key: "dependency.role_boundary_ambiguity",
    category: "dependency",
    stressFamily: "commercial_dependency",
    title: "Role / ownership ambiguity (vendor vs Malone vs facility)",
    description:
      "Unclear RACI under incident — delays remediation and inflames evaluation risk.",
    baseImpact: "medium",
    mitigationHints: [/raci|runbook|escalation\s+path/i],
    stressHints: [/unclear|tbd|best\s+effort/i],
  },
  {
    key: "dependency.integration_ownership_conflict",
    category: "dependency",
    stressFamily: "integration",
    title: "Integration ownership conflict under outage",
    description:
      "Vendor and facility each expect the other to carry fix — prolongs outage.",
    baseImpact: "medium",
    mitigationHints: [/owner|vendor\s+bridge|sev\s*1/i],
    stressHints: [/ticket\s+ping|no\s+sla/i],
  },
  {
    key: "commercial.low_price_hidden_cost_expansion",
    category: "commercial",
    stressFamily: "commercial_dependency",
    title: "Low bid / hidden cost expansion",
    description:
      "Commercially attractive bid masks pass-throughs, change orders, or scope creep under stress.",
    baseImpact: "medium",
    mitigationHints: [/not[\s-]?to[\s-]?exceed|cap|all[\s-]?in/i],
    stressHints: [/additional\s+fee|tm|change\s+order/i],
  },
];

export function scenarioByKey(key: string): FailureScenarioDefinition | undefined {
  return FAILURE_SCENARIO_TAXONOMY_V1.find((s) => s.key === key);
}
