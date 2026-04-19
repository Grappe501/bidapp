import { CANONICAL_PRICING_S000000479 } from "../data/canonical-pricing-s000000479";
import { getCanonicalArbuyModel } from "../data/canonical-arbuy-s000000479";
import { formatPricingCompactNarrativeAppendix } from "../data/pricing-proposal-language-mapping";
import { S000000479_BID_NUMBER } from "../data/canonical-rfp-s000000479";
import type {
  GroundingBundlePricing,
  PricingCategory,
  PricingHealthStatus,
  PricingItem,
  PricingModel,
} from "../types/pricing-model";

export const RFP_REQUIRED_PRICING_SERVICES: {
  key: string;
  test: (items: PricingItem[]) => boolean;
}[] = [
  {
    key: "dispensing",
    test: (items) =>
      items.some((i) =>
        /dispens|rx\b|fill|central\s*fill|packag|blister|unit[\s-]*dose/i.test(
          `${i.name} ${i.category}`,
        ),
      ),
  },
  {
    key: "emergency delivery",
    test: (items) =>
      items.some((i) =>
        /emergency|stat|2[\s-]*hour|delivery|courier/i.test(`${i.name} ${i.category}`),
      ),
  },
  {
    key: "packaging",
    test: (items) =>
      items.some((i) =>
        /packag|blister|unit[\s-]*dose|dose\s*pack/i.test(`${i.name} ${i.category}`),
      ),
  },
  {
    key: "billing",
    test: (items) =>
      items.some((i) =>
        /bill|medicaid|claim|837|835|revenue\s*cycle/i.test(`${i.name} ${i.category}`),
      ),
  },
  {
    key: "EHR integration",
    test: (items) =>
      items.some((i) =>
        /ehr|matrix|adt|interface|integration|hl7/i.test(`${i.name} ${i.category}`),
      ),
  },
];

const CATEGORY_RULES: { cat: PricingCategory; re: RegExp }[] = [
  { cat: "dispensing", re: /dispens|rx\b|fill|blister|unit[\s-]*dose|packag|central\s*fill/i },
  { cat: "delivery", re: /deliver|courier|emergency|stat|logistics|route/i },
  { cat: "clinical_services", re: /clinical|mtm|pharmacist|therapy|consult/i },
  { cat: "compliance_admin", re: /compliance|billing|medicaid|audit|admin|policy|835|837/i },
  { cat: "technology", re: /ehr|matrix|adt|interface|integration|hl7|api|software|it\b/i },
];

export function categorizePricingLine(name: string): PricingCategory {
  const n = name.trim();
  for (const { cat, re } of CATEGORY_RULES) {
    if (re.test(n)) return cat;
  }
  return "compliance_admin";
}

function ensureItemCategories(items: PricingItem[]): PricingItem[] {
  return items.map((it) => ({
    ...it,
    category: it.category || categorizePricingLine(it.name),
  }));
}

function isPricingModelJson(x: unknown): x is PricingModel {
  if (!x || typeof x !== "object") return false;
  const o = x as Record<string, unknown>;
  if (!Array.isArray(o.items) || !o.totals || typeof o.totals !== "object")
    return false;
  const t = o.totals as Record<string, unknown>;
  return typeof t.annual === "number" && typeof t.contractTotal === "number";
}

/**
 * Optional: paste JSON `PricingModel` into a price-sheet file **description** in the DB UI.
 */
export function tryParsePricingModelFromDescription(
  description: string | null | undefined,
): PricingModel | null {
  if (!description?.trim()) return null;
  const t = description.trim();
  if (!t.startsWith("{")) return null;
  try {
    const parsed = JSON.parse(t) as unknown;
    if (!isPricingModelJson(parsed)) return null;
    return {
      items: ensureItemCategories(parsed.items as PricingItem[]),
      totals: parsed.totals,
    };
  } catch {
    return null;
  }
}

function emptyModel(): PricingModel {
  return { items: [], totals: { annual: 0, contractTotal: 0 } };
}

function validateContractTotals(model: PricingModel): { ok: boolean; reasons: string[] } {
  const reasons: string[] = [];
  if (model.totals.annual <= 0) reasons.push("Annual total is missing or zero.");
  if (model.totals.contractTotal <= 0) reasons.push("Contract total is missing or zero.");
  for (const it of model.items) {
    if (typeof it.unitCost !== "number" || it.unitCost < 0)
      reasons.push(`Line "${it.name}" needs a defined unit cost.`);
    if (typeof it.totalCost !== "number" || it.totalCost < 0)
      reasons.push(`Line "${it.name}" needs a line total.`);
  }
  return { ok: reasons.length === 0, reasons };
}

function rfpCoverageRows(model: PricingModel): { key: string; ok: boolean }[] {
  return RFP_REQUIRED_PRICING_SERVICES.map(({ key, test }) => ({
    key,
    ok: test(model.items),
  }));
}

export type MinimalPricingFile = {
  name: string;
  category: string;
  description?: string | null;
  tags: string[];
};

/**
 * Builds structured pricing layer for grounding bundles and UI (canonical fallback for S000000479).
 */
export function buildPricingLayerForProject(
  bidNumber: string,
  files: MinimalPricingFile[],
): GroundingBundlePricing {
  const notes: string[] = [];
  let model: PricingModel | null = null;
  let parsed = false;

  for (const f of files) {
    if (
      f.category === "Pricing" ||
      /price|pricing|workbook|schedule\s*a/i.test(f.name)
    ) {
      const m = tryParsePricingModelFromDescription(f.description ?? null);
      if (m) {
        model = m;
        parsed = true;
        notes.push(`Parsed structured pricing JSON from file: ${f.name}`);
        break;
      }
    }
  }

  if (!model && bidNumber === S000000479_BID_NUMBER) {
    model = {
      items: CANONICAL_PRICING_S000000479.items.map((i) => ({ ...i })),
      totals: { ...CANONICAL_PRICING_S000000479.totals },
    };
    notes.push(
      "Using canonical structured pricing scaffold for S000000479 until a workbook JSON is pasted on the price sheet file description.",
    );
  }

  if (!model) {
    model = emptyModel();
    notes.push("No pricing JSON found — register line items or paste PricingModel JSON on the price sheet file.");
  }

  model = {
    items: ensureItemCategories(model.items),
    totals: model.totals,
  };

  const categorized =
    model.items.length > 0 &&
    model.items.every((i) => Boolean(i.category && String(i.category).length > 0));

  const rfpCoverage = rfpCoverageRows(model);
  const rfpOk = rfpCoverage.every((r) => r.ok);

  const contract = validateContractTotals(model);
  const contractCompliant = contract.ok;

  const ready =
    model.items.length > 0 && rfpOk && contractCompliant && categorized;

  return {
    model,
    parsed,
    categorized,
    rfpCoverage,
    contractCompliant,
    ready,
    notes: [...notes, ...contract.reasons.filter((r) => !notes.includes(r))],
  };
}

export function computePricingHealth(layer: GroundingBundlePricing): PricingHealthStatus {
  return {
    parsed: layer.parsed || layer.model.items.length > 0,
    categorized: layer.categorized,
    rfpCoverage: layer.rfpCoverage.every((r) => r.ok),
    contractCompliant: layer.contractCompliant,
    ready: layer.ready,
  };
}

/** Line items and totals only (no narrative appendix). */
export function formatPricingNumericSummaryExport(
  layer: GroundingBundlePricing,
): string {
  const m = layer.model;
  const lines = [
    "PRICING SUMMARY (structured)",
    `Annual total: $${m.totals.annual.toLocaleString()}`,
    `Contract total: $${m.totals.contractTotal.toLocaleString()}`,
    "",
    "Line items:",
    ...m.items.map(
      (i) =>
        `- [${i.category}] ${i.name} — ${i.unitCost} ${i.unit} → line $${i.totalCost.toLocaleString()}`,
    ),
    "",
    "RFP service coverage:",
    ...layer.rfpCoverage.map((r) => `  ${r.ok ? "✓" : "✗"} ${r.key}`),
    "",
    `Contract-compliant totals: ${layer.contractCompliant ? "yes" : "no"}`,
    `Ready: ${layer.ready ? "yes" : "no"}`,
  ];
  return lines.join("\n");
}

/**
 * Plain-text summary for submission package exports and clipboard (includes compact narrative).
 */
export function formatPricingSummaryExport(layer: GroundingBundlePricing): string {
  return (
    formatPricingNumericSummaryExport(layer) + formatPricingCompactNarrativeAppendix()
  );
}

/**
 * Relates structured pricing lines to the official ARBuy quote grid (counts and readiness only — no unit costs from ARBuy).
 */
export function computeArbuyQuoteStructureAlignment(
  bidNumber: string,
  layer: GroundingBundlePricing,
): {
  itemStructureLoaded: boolean;
  arbuyQuoteLineCount: number;
  pricingLineCount: number;
  lineItemPriceSupportAttached: boolean;
  quoteStructureReady: boolean;
  notes: string[];
} {
  const arbuy = getCanonicalArbuyModel(bidNumber);
  const pricingLineCount = layer.model.items.length;
  const lineItemPriceSupportAttached = pricingLineCount > 0;

  if (!arbuy) {
    return {
      itemStructureLoaded: false,
      arbuyQuoteLineCount: 0,
      pricingLineCount,
      lineItemPriceSupportAttached,
      quoteStructureReady: layer.ready,
      notes: ["No canonical ARBuy quote grid for this solicitation."],
    };
  }

  const arbuyQuoteLineCount = arbuy.items.length;
  const itemStructureLoaded = true;
  const notes: string[] = [
    `Official ARBuy quote lines (structure): ${arbuyQuoteLineCount}.`,
    `Structured workbook lines: ${pricingLineCount}.`,
  ];

  if (pricingLineCount !== arbuyQuoteLineCount) {
    notes.push(
      "Line counts differ — confirm the official price sheet maps workbook rows to ARBuy quote lines (ARBuy metadata does not supply unit costs).",
    );
  } else {
    notes.push("Workbook line count matches ARBuy quote line count.");
  }

  const quoteStructureReady =
    lineItemPriceSupportAttached && layer.ready && itemStructureLoaded;

  return {
    itemStructureLoaded,
    arbuyQuoteLineCount,
    pricingLineCount,
    lineItemPriceSupportAttached,
    quoteStructureReady,
    notes,
  };
}
