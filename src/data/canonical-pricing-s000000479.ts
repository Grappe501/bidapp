import type { PricingModel } from "../types/pricing-model";

/** Illustrative structured workbook for S000000479 — used when no JSON upload is present. */
export const CANONICAL_PRICING_S000000479: PricingModel = {
  items: [
    {
      name: "Central fill & dispensing operations (per member-month)",
      category: "dispensing",
      unit: "PMM",
      unitCost: 12.4,
      quantity: 24000,
      totalCost: 297600,
    },
    {
      name: "Stat and emergency delivery (per stop)",
      category: "delivery",
      unit: "stop",
      unitCost: 185,
      quantity: 480,
      totalCost: 88800,
    },
    {
      name: "Clinical pharmacist coverage & MTM (FTE)",
      category: "clinical_services",
      unit: "FTE-yr",
      unitCost: 165000,
      quantity: 2.5,
      totalCost: 412500,
    },
    {
      name: "Medicaid billing, 835/837, and audit support",
      category: "compliance_admin",
      unit: "annual",
      unitCost: 92000,
      quantity: 1,
      totalCost: 92000,
    },
    {
      name: "MatrixCare EHR interfaces & ADT (annual)",
      category: "technology",
      unit: "annual",
      unitCost: 78000,
      quantity: 1,
      totalCost: 78000,
    },
    {
      name: "Blister/unit-dose packaging line (annual)",
      category: "dispensing",
      unit: "annual",
      unitCost: 54000,
      quantity: 1,
      totalCost: 54000,
    },
  ],
  totals: {
    annual: 1022900,
    contractTotal: 6137400,
  },
};
