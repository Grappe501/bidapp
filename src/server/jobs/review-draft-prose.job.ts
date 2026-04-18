import { reviewDraftAgainstGrounding } from "../services/prose-review.service";
import type {
  DraftSectionType,
  GroundingBundlePayload,
  GroundedProseReviewResult,
} from "../../types";

export async function runReviewDraftProseJob(input: {
  sectionType: DraftSectionType;
  draftText: string;
  grounding: GroundingBundlePayload;
}): Promise<GroundedProseReviewResult> {
  const arch = input.grounding.architectureOptions
    .map((a) => `${a.name}: ${a.summary}`)
    .join("\n");
  return reviewDraftAgainstGrounding({
    sectionType: input.sectionType,
    draftText: input.draftText,
    requirements: input.grounding.requirements,
    evidence: input.grounding.evidence,
    requirementSupport: input.grounding.requirementSupport,
    vendorFacts: input.grounding.vendorFacts,
    architectureContext: arch || "(none)",
  });
}
