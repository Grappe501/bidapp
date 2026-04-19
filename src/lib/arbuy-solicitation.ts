import { getCanonicalArbuyModel } from "../data/canonical-arbuy-s000000479";
import { S000000479_BID_NUMBER } from "../data/canonical-rfp-s000000479";
import type {
  ArbuySolicitationCompliance,
  ArbuySolicitationModel,
} from "../types/arbuy-solicitation";
import type { GroundingBundlePricing } from "../types/pricing-model";

/** Same shape as pricing layer file inputs — kept local to avoid circular imports. */
export type ArbuyComplianceFile = {
  name: string;
  category: string;
};

/** Filename heuristics — match uploaded files to expected ARBuy attachment names (S000000479). */
const ARBUY_S479_FILE_TESTS: {
  category: ArbuySolicitationModel["attachments"][0]["category"];
  label: string;
  test: (name: string) => boolean;
}[] = [
  {
    category: "rfp",
    label: "RFP",
    test: (n) =>
      /S000000479.*\bRFP\b|\bRFP\b.*Pharmacy|Pharmacy Services.*\bRFP\b/i.test(n),
  },
  {
    category: "technical_packet",
    label: "Technical Proposal Packet",
    test: (n) => /Technical Proposal Packet/i.test(n),
  },
  {
    category: "price_sheet",
    label: "Official Solicitation Price Sheet",
    test: (n) =>
      /Official Solicitation Price Sheet|Price Sheet.*HDC|HDCs.*Price Sheet/i.test(n),
  },
  {
    category: "disclosure",
    label: "Contract and Grant Disclosure",
    test: (n) => /Contract and Grant Disclosure|\bDisclosure\b/i.test(n),
  },
  {
    category: "contract_sample",
    label: "SRV-1 sample",
    test: (n) => /SRV-1|Services-Contract-SRV-1/i.test(n),
  },
];

function fileMatchesAttachmentCategory(
  fileName: string,
  category: ArbuySolicitationModel["attachments"][0]["category"],
): boolean {
  const rule = ARBUY_S479_FILE_TESTS.find((r) => r.category === category);
  if (!rule) return false;
  return rule.test(fileName);
}

function anyFileMatches(files: { name: string }[], test: (n: string) => boolean): boolean {
  return files.some((f) => test(f.name));
}

/**
 * Compact ARBUY SOLICITATION block for OpenAI user prompts (grounding bundles / drafting).
 */
export function formatArbuySolicitationBlockForPrompt(
  model: ArbuySolicitationModel,
): string {
  const h = model.header;
  const attachLines = model.attachments
    .filter((a) => a.required)
    .map(
      (a) =>
        `- [${a.category}] ${a.name}${a.required ? " (required)" : ""}`,
    );
  const itemLines = model.items.map(
    (it) =>
      `  Line ${it.itemNumber}: UNSPSC ${it.unspscCode} × qty ${it.quantity} — ${it.description}`,
  );
  return [
    "ARBUY SOLICITATION (official procurement metadata — align submission, attachments, and quote grid):",
    `Solicitation: ${h.solicitationNumber} — ${h.description}`,
    `Bid opening (portal): ${h.bidOpeningDate}`,
    `Purchaser: ${h.purchaser} · ${h.organization} · ${h.department}`,
    `FY ${h.fiscalYear} · Type ${h.typeCode} · ${h.bidType} · ${h.purchaseMethod}`,
    h.requiredDate ? `Required performance / contract start context: ${h.requiredDate}` : "",
    h.availableDate ? `Solicitation available: ${h.availableDate}` : "",
    `Electronic quote via ARBuy: ${h.allowElectronicQuote ? "allowed" : "not indicated"}`,
    "",
    "Required attachments (names as posted):",
    ...attachLines,
    "",
    `Official quote items (${model.items.length} lines, quantity 1.0 each where shown):`,
    ...itemLines,
    "",
    "Use this block for portal identity, due date, submission method, and attachment set — do not invent alternate solicitation numbers or attachment lists.",
  ]
    .filter(Boolean)
    .join("\n");
}

export function computeArbuySubmissionCompliance(input: {
  bidNumber: string;
  files: ArbuyComplianceFile[];
  pricingLayer: GroundingBundlePricing;
}): ArbuySolicitationCompliance | null {
  const { bidNumber, files, pricingLayer } = input;
  const model = getCanonicalArbuyModel(bidNumber);
  if (!model) {
    return null;
  }

  const metadataLoaded = true;
  const submissionMethodKnown =
    typeof model.header.allowElectronicQuote === "boolean";
  const quoteLineCount = model.items.length;

  const missing: string[] = [];
  for (const att of model.attachments) {
    if (!att.required) continue;
    const ok = files.some((f) => fileMatchesAttachmentCategory(f.name, att.category));
    if (!ok) {
      missing.push(att.name);
    }
  }
  const attachmentsComplete = missing.length === 0;

  const priceSheetDocumentPresent = anyFileMatches(
    files,
    (n) => fileMatchesAttachmentCategory(n, "price_sheet"),
  );

  const pricingLineCount = pricingLayer.model.items.length;
  const pricingSupportPresent = pricingLineCount > 0;

  const quoteStructureCountAligned = pricingLineCount === quoteLineCount;

  const issues: string[] = [];
  if (!attachmentsComplete) {
    issues.push(
      `Missing expected ARBuy-linked files (name match): ${missing.slice(0, 5).join("; ")}`,
    );
  }
  if (!priceSheetDocumentPresent) {
    issues.push(
      "Official solicitation price sheet file not detected by filename — upload or rename to match the ARBuy posting.",
    );
  }
  if (!pricingSupportPresent) {
    issues.push("No structured pricing line items — paste PricingModel JSON on a Pricing file or rely on canonical scaffold.");
  }
  if (!quoteStructureCountAligned && pricingSupportPresent) {
    issues.push(
      `Pricing workbook has ${pricingLineCount} line(s); ARBuy quote grid defines ${quoteLineCount} — confirm mapping to official price sheet (unit costs are not inferred from ARBuy).`,
    );
  }

  const ready =
    metadataLoaded &&
    submissionMethodKnown &&
    attachmentsComplete &&
    priceSheetDocumentPresent &&
    pricingSupportPresent;

  return {
    applicable: true,
    metadataLoaded,
    submissionMethodKnown,
    attachmentsComplete,
    missingAttachments: missing,
    quoteLineCount,
    pricingLineCount,
    quoteStructureCountAligned,
    priceSheetDocumentPresent,
    pricingSupportPresent,
    ready,
    issues,
  };
}

/** Server-side: attach canonical ARBuy slice when building bundles (relative-import safe). */
export function resolveArbuyModelForBidNumber(
  bidNumber: string,
): ArbuySolicitationModel | undefined {
  if (bidNumber !== S000000479_BID_NUMBER) return undefined;
  return getCanonicalArbuyModel(bidNumber) ?? undefined;
}
