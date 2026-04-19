/**
 * Structured pricing workbook model — aligns with RFP services, SRV-1, and proposal narrative.
 */

export type PricingCategory =
  | "dispensing"
  | "delivery"
  | "clinical_services"
  | "compliance_admin"
  | "technology";

export interface PricingItem {
  name: string;
  category: PricingCategory;
  unit: string;
  unitCost: number;
  quantity?: number;
  totalCost: number;
}

export interface PricingModel {
  items: PricingItem[];
  totals: {
    annual: number;
    contractTotal: number;
  };
}

/** Attached to {@link GroundingBundlePayload.pricing} after bundle build. */
export type GroundingBundlePricing = {
  model: PricingModel;
  /** True when JSON was parsed from an uploaded file description or canonical merged. */
  parsed: boolean;
  /** All line items have a recognized category. */
  categorized: boolean;
  rfpCoverage: { key: string; ok: boolean }[];
  contractCompliant: boolean;
  ready: boolean;
  notes: string[];
};

export type PricingHealthStatus = {
  parsed: boolean;
  categorized: boolean;
  rfpCoverage: boolean;
  contractCompliant: boolean;
  ready: boolean;
};
