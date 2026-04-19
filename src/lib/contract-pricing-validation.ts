import type { GroundingBundlePricing, OutputArtifact } from "@/types";
import type { StructuredPricingValidation } from "../types/contract-model";

/**
 * SRV-1 / state template: reject flat, unstructured pricing in favor of defined rates + calculations.
 * When {@link GroundingBundlePricing} is supplied (from file JSON or canonical scaffold), contract line
 * totals and annual value must validate before the workbook is considered structurally aligned.
 */
export function validateStructuredPricing(
  artifacts: OutputArtifact[],
  pricingLayer?: GroundingBundlePricing | null,
): StructuredPricingValidation {
  const rejectReasons: string[] = [];

  const price = artifacts.find((a) => a.artifactType === "Price Sheet Support");
  if (!price) {
    rejectReasons.push(
      "No price sheet artifact — link the official workbook and structured line items.",
    );
  } else {
    const blob = `${price.title} ${price.notes}`.toLowerCase();
    const flatUnstructured =
      /\bflat\s+fee\b|\blump\s?sum\b|single[\s-]*line\s+total|unstructured\s+pricing|no\s+breakdown/i.test(
        blob,
      );

    if (flatUnstructured) {
      rejectReasons.push(
        "Flat or unstructured pricing language conflicts with SRV-1 — use defined rates, calculations, service breakdown, and annualized totals.",
      );
    }

    const validated =
      price.isValidated ||
      price.status === "Validated" ||
      price.status === "Locked";

    if (!validated) {
      rejectReasons.push(
        "Price sheet artifact is not validated — complete structured pricing review before submission.",
      );
    }
  }

  const layerHasStructure =
    pricingLayer &&
    (pricingLayer.model.items.length > 0 || pricingLayer.parsed);

  if (layerHasStructure) {
    if (!pricingLayer.contractCompliant) {
      rejectReasons.push(
        "Structured pricing model is missing unit costs, line totals, or annual/contract totals — not contract-aligned.",
      );
    }
    if (!pricingLayer.rfpCoverage.every((r) => r.ok)) {
      const missing = pricingLayer.rfpCoverage.filter((r) => !r.ok).map((r) => r.key);
      rejectReasons.push(
        `RFP-required pricing signals not covered in line items: ${missing.join(", ")}.`,
      );
    }
  }

  return {
    ok: rejectReasons.length === 0,
    rejectReasons,
  };
}
