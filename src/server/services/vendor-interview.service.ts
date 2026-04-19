import { VENDOR_INTERVIEW_GENERATION_RULES } from "../../data/vendor-intelligence-system";
import {
  fillFrameworkVars,
  INTERVIEW_FRAMEWORK_BANK,
} from "../lib/vendor-interview-framework";
import {
  listArchitectureComponentsByVendorInProject,
  listArchitectureOptionsByProject,
} from "../repositories/architecture.repo";
import { listRequirementsByProject } from "../repositories/requirement.repo";
import {
  listVendorFitDimensionsByVendor,
  listVendorIntegrationRequirementsByVendor,
} from "../repositories/vendor-intelligence.repo";
import {
  replaceVendorInterviewQuestionsFull,
  type InterviewQuestionInsertRow,
} from "../repositories/vendor-interview.repo";
import { listVendorClaimValidations } from "../repositories/vendor-claim-validation.repo";
import {
  getVendorById,
  listVendorClaimsByVendorId,
} from "../repositories/vendor.repo";
import { effectiveSupportLevelFromRow } from "./vendor-claim-validation-merge.service";

function fillTemplate(t: string, vars: Record<string, string>): string {
  let s = t;
  for (const [k, v] of Object.entries(vars)) {
    s = s.replaceAll(`{${k}}`, v);
  }
  return s;
}

function priorityOrder(p: string): number {
  if (p === "P1") return 1;
  if (p === "P2") return 2;
  return 3;
}

/**
 * Generates 20+ ranked interview questions from framework + bid requirements + fit/integration gaps.
 */
export async function generateVendorInterviewQuestions(
  vendorId: string,
  projectId: string,
): Promise<{ inserted: number }> {
  const vendor = await getVendorById(vendorId);
  if (!vendor) throw new Error("Vendor not found");
  if (vendor.projectId !== projectId) throw new Error("Vendor not in project");

  const [reqs, dims, integration, claims, archOpts, archUse] = await Promise.all([
    listRequirementsByProject(projectId),
    listVendorFitDimensionsByVendor(vendorId),
    listVendorIntegrationRequirementsByVendor(vendorId),
    listVendorClaimsByVendorId(vendorId, 40),
    listArchitectureOptionsByProject(projectId),
    listArchitectureComponentsByVendorInProject({ projectId, vendorId }),
  ]);

  const recommended = archOpts.find((o) => o.recommended) ?? archOpts[0];
  const stackHint = recommended
    ? `${recommended.name} (${archUse.map((a) => a.role).slice(0, 4).join(", ") || "roles TBD"})`
    : "recommended architecture option";

  const rows: InterviewQuestionInsertRow[] = [];
  let sortOrder = 0;

  for (const seed of INTERVIEW_FRAMEWORK_BANK) {
    const q = fillFrameworkVars(seed.question, {
      vendorName: vendor.name,
      stackHint,
    });
    rows.push({
      question: q,
      category: seed.category,
      priority: seed.priority,
      linkedGapId: null,
      whyItMatters: seed.whyItMatters,
      riskIfUnanswered: seed.riskIfUnanswered,
      linkedRequirementKeys: [],
      linkedFitDimensionKeys: seed.linkedFitDimensionKeys ?? [],
      linkedGapKeys: [],
      answerStatus: "unanswered",
      sortOrder: sortOrder++,
    });
  }

  const mand = reqs.filter((r) => r.mandatory);
  for (const r of mand.slice(0, 8)) {
    const title = `${r.title}`.slice(0, 80);
    rows.push({
      question: `How does ${vendor.name} specifically satisfy mandatory requirement "${title}" — what evidence, process, and owners apply?`,
      category: "proof",
      priority: "P2",
      linkedGapId: null,
      whyItMatters: "Mandatory requirements drive scoring; vague mapping fails review.",
      riskIfUnanswered: "Requirement coverage gap in Solution/Interview.",
      linkedRequirementKeys: [r.id],
      linkedFitDimensionKeys: ["technical_capability"],
      linkedGapKeys: [],
      answerStatus: "unanswered",
      sortOrder: sortOrder++,
    });
  }

  for (const d of dims) {
    if (d.score > 3) continue;
    const rule = VENDOR_INTERVIEW_GENERATION_RULES.mustAsk.find(
      (x) =>
        (d.dimensionKey === "integration_fit" && x.trigger === "gap_in_integration_fit") ||
        (d.dimensionKey === "technical_capability" && x.trigger === "gap_in_technical_capability"),
    );
    if (rule) {
      rows.push({
        question: fillTemplate(rule.template, {
          integration_touchpoint: "core integrations in scope",
        }),
        category: "integration",
        priority: "P1",
        linkedGapId: d.id,
        whyItMatters: `Fit dimension ${d.dimensionKey} is weak — must resolve before award.`,
        riskIfUnanswered: "Persistent gap in comparative scoring and risk narrative.",
        linkedRequirementKeys: [],
        linkedFitDimensionKeys: [d.dimensionKey],
        linkedGapKeys: [d.dimensionKey],
        answerStatus: "unanswered",
        sortOrder: sortOrder++,
      });
    }
  }

  for (const ir of integration) {
    if (ir.status !== "unknown" && ir.status !== "gap") continue;
    rows.push({
      question: `For integration requirement "${ir.requirementKey}": what is the concrete plan, owner, and evidence to move from ${ir.status} to verified?`,
      category: "integration",
      priority: "P1",
      linkedGapId: null,
      whyItMatters: "Unknown integration rows block confident Solution language.",
      riskIfUnanswered: "Integration remains a scored gap.",
      linkedRequirementKeys: [],
      linkedFitDimensionKeys: ["integration_fit"],
      linkedGapKeys: [ir.requirementKey],
      answerStatus: "unanswered",
      sortOrder: sortOrder++,
    });
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
      rows.push({
        question: fillTemplate(rule.template, {
          claim_summary: c.claimText.slice(0, 120),
        }),
        category: "proof",
        priority: "P2",
        linkedGapId: null,
        whyItMatters: "Low-confidence claims require proof under Interview.",
        riskIfUnanswered: "Claim may be discounted as marketing.",
        linkedRequirementKeys: [],
        linkedFitDimensionKeys: [],
        linkedGapKeys: [],
        answerStatus: "unanswered",
        sortOrder: sortOrder++,
      });
    }
  }

  const claimVals = await listVendorClaimValidations(vendorId);
  let claimFollowUps = 0;
  for (const val of claimVals) {
    if (claimFollowUps >= 8) break;
    const eff = effectiveSupportLevelFromRow(val);
    const hot =
      ["integration", "delivery", "compliance", "clinical"].includes(
        String(val.claimCategory),
      ) || val.isCritical;
    if (
      !hot ||
      (eff !== "weak" &&
        eff !== "none" &&
        val.contradictionStatus === "none")
    ) {
      continue;
    }
    claimFollowUps++;
    rows.push({
      question: `${vendor.name}: claim validation flags "${val.normalizedClaimKey}" (${eff} support${val.contradictionStatus !== "none" ? `, ${val.contradictionStatus} contradiction` : ""}). Walk through concrete evidence — live deployment, interface method, and owners — and reconcile any contradicting facts.`,
      category: "truth_test",
      priority: "P1",
      linkedGapId: null,
      whyItMatters: "Proposal-critical claims must be defensible; weak or contradicted claims inflate scoring risk.",
      riskIfUnanswered: "Evaluator may treat Solution/Risk language as marketing unless verified.",
      linkedRequirementKeys: [],
      linkedFitDimensionKeys: [],
      linkedGapKeys: [val.normalizedClaimKey],
      answerStatus: "unanswered",
      sortOrder: sortOrder++,
    });
  }

  rows.sort((a, b) => {
    const po = priorityOrder(a.priority) - priorityOrder(b.priority);
    if (po !== 0) return po;
    return a.sortOrder - b.sortOrder;
  });
  rows.forEach((r, i) => {
    r.sortOrder = i;
  });

  await replaceVendorInterviewQuestionsFull({ vendorId, rows });

  return { inserted: rows.length };
}
