import {
  CANONICAL_RFP_S000000479,
  S000000479_BID_NUMBER,
} from "../data/canonical-rfp-s000000479";
import type { GroundingBundleRfp, StructuredRfp } from "../types/rfp-model";

type ProjectLike = {
  bidNumber: string;
  title: string;
  issuingOrganization: string;
  dueDate: string;
};

function buildNarrativeLayers(s: StructuredRfp): Omit<
  GroundingBundleRfp,
  keyof StructuredRfp | "stub"
> {
  const { requirements: req, evaluation: ev, risks } = s;
  const requirementsSummary = [
    `Solicitation ${s.core.solicitationNumber}: ${req.facilities} facilities across ${req.locations.join(", ") || "designated locations"}.`,
    `Delivery: ${req.deliveryRequirements.join("; ")}.`,
    `Services: ${req.serviceRequirements.join("; ")}.`,
    `Technology: ${req.techRequirements.join("; ")}.`,
    `Compliance: ${req.complianceRequirements.join("; ")}.`,
  ].join(" ");

  const serviceExpectations = [
    ...req.deliveryRequirements,
    ...req.serviceRequirements,
  ];

  const technicalExpectations = [
    ...req.techRequirements,
    ...req.complianceRequirements.filter((c) => /HIPAA|security|integration/i.test(c)),
  ];

  const riskAreas = risks.criticalRisks;

  const evaluationPriorities = [
    `Experience (${ev.experienceWeight}%): past performance, staffing, references.`,
    `Solution (${ev.solutionWeight}%): technical approach, operations, integration.`,
    `Risk (${ev.riskWeight}%): mitigation, compliance, continuity.`,
    `Interview (${ev.interviewWeight}%): oral presentation and clarification.`,
  ];

  return {
    requirementsSummary,
    serviceExpectations,
    technicalExpectations,
    riskAreas,
    evaluationPriorities,
  };
}

function mergeCanonicalWithProject(
  canonical: StructuredRfp,
  project: ProjectLike,
): StructuredRfp {
  return {
    ...canonical,
    core: {
      ...canonical.core,
      solicitationNumber: project.bidNumber,
      title: project.title?.trim() || canonical.core.title,
      dueDate: project.dueDate?.slice(0, 10) || canonical.core.dueDate,
    },
  };
}

function buildStubStructuredRfp(project: ProjectLike): StructuredRfp {
  return {
    core: {
      solicitationNumber: project.bidNumber,
      title: project.title,
      agency: project.issuingOrganization.split("(")[0]?.trim() || "—",
      department: project.issuingOrganization,
      dueDate: project.dueDate.slice(0, 10),
      submissionMethod: "—",
      contractType: "—",
      contractTerm: { baseYears: 0, extensionYears: 0 },
    },
    evaluation: {
      experienceWeight: 0,
      solutionWeight: 0,
      riskWeight: 0,
      interviewWeight: 0,
      totalScore: 0,
    },
    requirements: {
      facilities: 0,
      locations: [],
      deliveryRequirements: [],
      serviceRequirements: [],
      techRequirements: [],
      complianceRequirements: [],
    },
    submission: { requiredDocuments: [] },
    risks: { criticalRisks: [] },
  };
}

/**
 * Builds `groundingBundle.rfp` for persistence on grounding bundles (server + shared logic).
 */
export function buildProjectGroundingBundleRfp(project: ProjectLike): GroundingBundleRfp {
  if (project.bidNumber === S000000479_BID_NUMBER) {
    const merged = mergeCanonicalWithProject(CANONICAL_RFP_S000000479, project);
    return {
      ...merged,
      ...buildNarrativeLayers(merged),
      stub: false,
    };
  }

  const stubData = buildStubStructuredRfp(project);
  const narrative = buildNarrativeLayers(stubData);
  return {
    ...stubData,
    ...narrative,
    requirementsSummary:
      narrative.requirementsSummary ||
      "No canonical RFP profile is registered for this solicitation — add structured RFP data before relying on scores.",
    stub: true,
  };
}
