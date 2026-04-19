import type { FileRecord } from "@/types";
import type {
  GroundingBundleRfp,
  RfpDocumentCoverageResult,
  RfpDocumentSlug,
  RfpHealthStatus,
  StructuredRfp,
} from "@/types/rfp-model";

export function pickStructuredRfp(
  g: GroundingBundleRfp | StructuredRfp,
): StructuredRfp {
  return {
    core: g.core,
    evaluation: g.evaluation,
    requirements: g.requirements,
    submission: g.submission,
    risks: g.risks,
  };
}

/** Keyword groups per required submission artifact (file name / description matching). */
export const RFP_REQUIRED_DOC_MATCHERS: Record<
  RfpDocumentSlug,
  { label: string; patterns: RegExp[] }
> = {
  signed_proposal: {
    label: "Signed proposal",
    patterns: [/signed/i, /signature/i, /proposal(?!.*technical)/i],
  },
  technical_proposal: {
    label: "Technical proposal",
    patterns: [/technical/i, /tech\s*prop/i, /volume\s*ii/i],
  },
  price_sheet: {
    label: "Price sheet",
    patterns: [/price/i, /pricing/i, /cost\s*sheet/i, /schedule\s*a/i],
  },
  options_form: {
    label: "Options form",
    patterns: [/option/i, /alternat/i],
  },
  eo_policy: {
    label: "EO policy",
    patterns: [/eo\b/i, /equal\s*opp/i, /eeoc/i, /non-?discrim/i],
  },
  subcontractor_form: {
    label: "Subcontractor form",
    patterns: [/subcontract/i, /sub-?vendor/i, /teaming/i],
  },
};

const SLUG_ORDER = Object.keys(RFP_REQUIRED_DOC_MATCHERS) as RfpDocumentSlug[];

function fileHaystack(f: FileRecord): string {
  return `${f.name} ${f.description ?? ""} ${f.tags.join(" ")} ${f.category}`.toLowerCase();
}

function isParsed(f: FileRecord): boolean {
  return f.status === "Processed" || f.status === "Needs Review";
}

function isUnstructured(f: FileRecord): boolean {
  return f.status === "Uploaded" || f.status === "Queued" || f.status === "Error";
}

function bestMatchForSlug(
  slug: RfpDocumentSlug,
  files: FileRecord[],
  used: Set<string>,
): FileRecord | undefined {
  const { patterns } = RFP_REQUIRED_DOC_MATCHERS[slug];
  const candidates = files.filter((f) => !used.has(f.id));
  let best: { f: FileRecord; score: number } | undefined;
  for (const f of candidates) {
    const h = fileHaystack(f);
    let score = 0;
    for (const p of patterns) {
      if (p.test(h)) score += 2;
    }
    if (/solicitation|rfp|instruction/i.test(h) && slug === "signed_proposal") {
      score += 1;
    }
    if (score > 0 && (!best || score > best.score)) {
      best = { f, score };
    }
  }
  return best && best.score >= 1 ? best.f : undefined;
}

/**
 * Maps workspace files to required submission documents for coverage reporting.
 */
export function validateRfpFileCoverage(
  _structuredRfp: StructuredRfp,
  files: FileRecord[],
): RfpDocumentCoverageResult {
  const used = new Set<string>();
  const mapped: Partial<Record<RfpDocumentSlug, string>> = {};
  const parsedDocuments: string[] = [];
  const unstructuredDocuments: string[] = [];
  const missingDocuments: string[] = [];

  for (const slug of SLUG_ORDER) {
    const label = RFP_REQUIRED_DOC_MATCHERS[slug].label;
    const hit = bestMatchForSlug(slug, files, used);
    if (!hit) {
      missingDocuments.push(label);
      continue;
    }
    used.add(hit.id);
    mapped[slug] = hit.name;
    if (isParsed(hit)) {
      parsedDocuments.push(`${label}: ${hit.name}`);
    } else if (isUnstructured(hit)) {
      unstructuredDocuments.push(`${label} (pending structure): ${hit.name}`);
    } else {
      parsedDocuments.push(`${label}: ${hit.name}`);
    }
  }

  return {
    missingDocuments,
    parsedDocuments,
    unstructuredDocuments,
    mapped,
  };
}

/**
 * Derives RFP health flags for dashboard / intelligence.
 */
export function computeRfpHealth(
  structuredRfp: StructuredRfp,
  coverage: RfpDocumentCoverageResult,
  files: FileRecord[],
): RfpHealthStatus {
  const structured =
    structuredRfp.core.solicitationNumber.length > 0 &&
    structuredRfp.evaluation.totalScore > 0;
  const requirementsExtracted =
    structuredRfp.requirements.deliveryRequirements.length > 0 ||
    structuredRfp.requirements.serviceRequirements.length > 0;

  const submissionDocsComplete =
    coverage.missingDocuments.length === 0 &&
    coverage.unstructuredDocuments.length === 0;

  const sol = solicitationFiles(files);
  const parsed =
    sol.some((f) => f.status === "Processed" || f.status === "Needs Review") ||
    coverage.parsedDocuments.length > 0;

  const readyForDrafting =
    structured &&
    requirementsExtracted &&
    submissionDocsComplete &&
    coverage.unstructuredDocuments.length === 0 &&
    structuredRfp.risks.criticalRisks.length > 0;

  return {
    parsed,
    structured,
    requirementsExtracted,
    submissionDocsComplete,
    readyForDrafting,
  };
}

export function solicitationFiles(files: FileRecord[]): FileRecord[] {
  return files.filter(
    (f) =>
      f.category === "Solicitation" ||
      /solicitation|rfp|s000000479|instruction/i.test(f.name),
  );
}
