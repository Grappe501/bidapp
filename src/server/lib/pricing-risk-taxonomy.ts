/**
 * Pricing risk keys — map to signals in pricing-reality-engine (heuristic, not accounting).
 */
export const PRICING_RISK_KEYS = [
  "pricing.missing_service_lines",
  "pricing.hidden_delivery_costs",
  "pricing.integration_not_included",
  "pricing.malone_dependency_unpriced",
  "pricing.staffing_underestimated",
  "pricing.emergency_support_underpriced",
  "pricing.compliance_costs_missing",
  "pricing.billing_complexity_underestimated",
  "pricing.variable_volume_risk",
  "pricing.change_order_likelihood",
  "pricing.discount_unsustainable",
  "pricing.overhead_not_visible",
] as const;

export type PricingRiskKey = (typeof PRICING_RISK_KEYS)[number];

export const PRICING_RISK_LABELS: Record<string, string> = {
  "pricing.missing_service_lines": "Required service areas missing from workbook",
  "pricing.hidden_delivery_costs": "Delivery / logistics cost may be under-reflected",
  "pricing.integration_not_included": "Integration / interface work not clearly priced",
  "pricing.malone_dependency_unpriced": "Malone-led work not visible in pricing",
  "pricing.staffing_underestimated": "Staffing / FTE burden may be underestimated",
  "pricing.emergency_support_underpriced": "Emergency / after-hours support underpriced",
  "pricing.compliance_costs_missing": "Compliance / audit / HIPAA support thin or missing",
  "pricing.billing_complexity_underestimated": "Medicaid / billing complexity under-reflected",
  "pricing.variable_volume_risk": "Volume or census sensitivity not bounded",
  "pricing.change_order_likelihood": "Scope creep / change-order exposure",
  "pricing.discount_unsustainable": "Price level hard to sustain vs scope signals",
  "pricing.overhead_not_visible": "Overhead / program management not explicit",
};
