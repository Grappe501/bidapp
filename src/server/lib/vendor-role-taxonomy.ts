/**
 * Role taxonomy for S000000479 / Malone multi-party PBM stack — ownership decisions, not org charts.
 */

export type RoleOwnershipBand =
  | "own"
  | "share"
  | "support"
  | "avoid"
  | "unknown";

export type RoleFitBand = "strong" | "adequate" | "weak" | "unknown";

export type RoleRiskBand = "low" | "medium" | "high";

export type RoleStrategyAssessment =
  | "clear_fit"
  | "usable_with_malone_support"
  | "fragile"
  | "misaligned";

export type VendorRoleDefinition = {
  key: string;
  label: string;
  /** Fit dimension keys from vendor fit matrix */
  relatedFitDimensions: string[];
  /** Claim validation normalized keys (optional) */
  relatedClaimKeys?: string[];
  /** Keywords in corpus for weak/strong hints */
  corpusHintsOwn?: RegExp[];
  corpusHintsAvoid?: RegExp[];
  /** Solicitation-critical for gate logic */
  criticalForBid: boolean;
};

/** Roles that block or downgrade readiness if avoid/unknown without mitigation. */
export const CRITICAL_ROLE_KEYS = new Set([
  "operations.dispensing",
  "logistics.routine_delivery",
  "integration.matrixcare_interface",
  "billing.medicaid_and_insurance_billing",
  "implementation.project_management",
  "compliance.hipaa_hitech_data_handling",
]);

export const VENDOR_ROLE_TAXONOMY_V1: VendorRoleDefinition[] = [
  {
    key: "operations.dispensing",
    label: "Dispensing operations",
    relatedFitDimensions: ["delivery_operations", "technical_capability"],
    relatedClaimKeys: ["operations.delivery"],
    corpusHintsOwn: [/dispens|pharmacist|fulfill|rx\s+workflow/i],
    criticalForBid: true,
  },
  {
    key: "operations.blister_packaging",
    label: "Blister / adherence packaging",
    relatedFitDimensions: ["delivery_operations", "technical_capability"],
    criticalForBid: false,
  },
  {
    key: "operations.off_cycle_and_emergency_supply",
    label: "Off-cycle & emergency supply",
    relatedFitDimensions: ["delivery_operations"],
    corpusHintsOwn: [/emergency|stat|urgent|after[\s-]*hours/i],
    criticalForBid: false,
  },
  {
    key: "operations.schedule_ii_handling",
    label: "Schedule II handling",
    relatedFitDimensions: ["risk_posture", "delivery_operations"],
    criticalForBid: false,
  },
  {
    key: "logistics.routine_delivery",
    label: "Routine delivery",
    relatedFitDimensions: ["delivery_operations"],
    corpusHintsOwn: [/courier|route|delivery|chain[\s-]of[\s-]custody/i],
    criticalForBid: true,
  },
  {
    key: "logistics.urgent_two_hour_delivery",
    label: "Urgent / two-hour delivery",
    relatedFitDimensions: ["delivery_operations"],
    corpusHintsOwn: [/two[\s-]*hour|2[\s-]*hr|urgent\s+deliver/i],
    criticalForBid: false,
  },
  {
    key: "clinical.prior_authorization_management",
    label: "Prior authorization management",
    relatedFitDimensions: ["technical_capability", "risk_posture"],
    criticalForBid: false,
  },
  {
    key: "clinical.medication_review_and_interactions",
    label: "Medication review & interactions",
    relatedFitDimensions: ["technical_capability", "risk_posture"],
    criticalForBid: false,
  },
  {
    key: "billing.medicaid_and_insurance_billing",
    label: "Medicaid / insurance billing",
    relatedFitDimensions: ["risk_posture", "technical_capability"],
    relatedClaimKeys: ["billing.medicaid"],
    corpusHintsOwn: [/medicaid|billing|claim|837|835/i],
    criticalForBid: true,
  },
  {
    key: "billing.denial_rework_and_followup",
    label: "Denial rework & follow-up",
    relatedFitDimensions: ["risk_posture", "delivery_operations"],
    criticalForBid: false,
  },
  {
    key: "integration.matrixcare_interface",
    label: "MatrixCare interface",
    relatedFitDimensions: ["integration_fit"],
    relatedClaimKeys: ["integration.matrixcare"],
    corpusHintsAvoid: [/manual\s+entry|spreadsheet|no\s+direct/i],
    criticalForBid: true,
  },
  {
    key: "integration.bidirectional_data_exchange",
    label: "Bidirectional data exchange",
    relatedFitDimensions: ["integration_fit"],
    criticalForBid: false,
  },
  {
    key: "integration.error_logging_and_alerting",
    label: "Error logging & alerting",
    relatedFitDimensions: ["integration_fit", "risk_posture"],
    criticalForBid: false,
  },
  {
    key: "implementation.project_management",
    label: "Project management",
    relatedFitDimensions: ["technical_capability", "delivery_operations"],
    criticalForBid: true,
  },
  {
    key: "implementation.go_live_execution",
    label: "Go-live execution",
    relatedFitDimensions: ["delivery_operations", "technical_capability"],
    corpusHintsOwn: [/go[\s-]*live|rollout|cutover/i],
    criticalForBid: false,
  },
  {
    key: "support.training_and_monthly_visits",
    label: "Training & monthly visits",
    relatedFitDimensions: ["delivery_operations", "references_proof"],
    criticalForBid: false,
  },
  {
    key: "support.pharmacy_liaison",
    label: "Pharmacy liaison",
    relatedFitDimensions: ["delivery_operations"],
    criticalForBid: false,
  },
  {
    key: "compliance.audit_reporting",
    label: "Audit & reporting",
    relatedFitDimensions: ["risk_posture"],
    criticalForBid: false,
  },
  {
    key: "compliance.hipaa_hitech_data_handling",
    label: "HIPAA / HITECH data handling",
    relatedFitDimensions: ["risk_posture", "technical_capability"],
    corpusHintsOwn: [/hipaa|hitech|phi|encryption|baa/i],
    criticalForBid: true,
  },
  {
    key: "analytics.monthly_spend_reporting",
    label: "Monthly spend reporting",
    relatedFitDimensions: ["technical_capability", "risk_posture"],
    criticalForBid: false,
  },
  {
    key: "strategy.cost_optimization_consulting",
    label: "Cost optimization consulting",
    relatedFitDimensions: ["references_proof", "risk_posture"],
    criticalForBid: false,
  },
];
