import { VENDOR_INTERVIEW_GENERATION_RULES } from "../../data/vendor-intelligence-system";
import {
  listVendorFitDimensionsByVendor,
  replaceVendorInterviewQuestions,
} from "../repositories/vendor-intelligence.repo";
import {
  getVendorById,
  listVendorClaimsByVendorId,
} from "../repositories/vendor.repo";

function fillTemplate(t: string, vars: Record<string, string>): string {
  let s = t;
  for (const [k, v] of Object.entries(vars)) {
    s = s.replaceAll(`{${k}}`, v);
  }
  return s;
}

/**
 * Generates must-ask / prove-it / risk questions from stored gaps and claims (templates, not invented facts).
 */
export async function generateVendorInterviewQuestions(
  vendorId: string,
): Promise<{ inserted: number }> {
  const vendor = await getVendorById(vendorId);
  if (!vendor) throw new Error("Vendor not found");

  const dims = await listVendorFitDimensionsByVendor(vendorId);
  const claims = await listVendorClaimsByVendorId(vendorId, 40);

  const rows: Array<{
    question: string;
    category: string;
    priority: string;
    linkedGapId?: string | null;
  }> = [];

  for (const d of dims) {
    if (d.score > 2) continue;
    if (d.dimensionKey === "integration_fit") {
      const rule = VENDOR_INTERVIEW_GENERATION_RULES.mustAsk.find(
        (r) => r.trigger === "gap_in_integration_fit",
      );
      if (rule) {
        rows.push({
          question: fillTemplate(rule.template, {
            integration_touchpoint: "core integrations in scope",
          }),
          category: "must-ask",
          priority: "P0",
          linkedGapId: d.id,
        });
      }
    }
    if (d.dimensionKey === "technical_capability") {
      const rule = VENDOR_INTERVIEW_GENERATION_RULES.mustAsk.find(
        (r) => r.trigger === "gap_in_technical_capability",
      );
      if (rule) {
        rows.push({
          question: rule.template,
          category: "must-ask",
          priority: "P0",
          linkedGapId: d.id,
        });
      }
    }
  }

  for (const c of claims) {
    const low =
      c.confidence.toLowerCase() === "low" ||
      c.credibility.toLowerCase() === "marketing";
    if (!low) continue;
    const rule = VENDOR_INTERVIEW_GENERATION_RULES.proveIt.find(
      (r) => r.trigger === "low_confidence_claim",
    );
    if (rule) {
      const summary = c.claimText.slice(0, 120);
      rows.push({
        question: fillTemplate(rule.template, { claim_summary: summary }),
        category: "prove-it",
        priority: "P1",
        linkedGapId: null,
      });
    }
  }

  for (const r of vendor.risks.slice(0, 6)) {
    const rule = VENDOR_INTERVIEW_GENERATION_RULES.risk.find(
      (x) => x.trigger === "risk_facet_or_stored_risk",
    );
    if (rule) {
      rows.push({
        question: fillTemplate(rule.template, { risk_summary: r.slice(0, 120) }),
        category: "risk",
        priority: "P1",
        linkedGapId: null,
      });
    }
  }

  await replaceVendorInterviewQuestions({ vendorId, rows });

  return { inserted: rows.length };
}
