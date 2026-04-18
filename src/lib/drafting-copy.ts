/**
 * Shared user-facing copy for the drafting module (BP-006).
 * Keeps terminology consistent: grounding bundle, requirement coverage,
 * score strength, constraint risk, unsupported claim, draft status, version / active version.
 */
export const DRAFTING_COPY = {
  feedbackSectionTitle: "Draft feedback",
  feedbackSectionBody:
    "Requirement coverage, score strength, and constraint risk use the same structured snapshot from the model. Use them together to prioritize edits. These checks are conservative and do not replace RFP or legal review.",
  metadataFooterHint:
    "Prioritized fixes: use Draft feedback above (requirement coverage, score strength, constraint risk).",
  studioIntro:
    "Open a section to attach a grounding bundle, generate a draft, and refine with requirement coverage, score strength, and constraint risk in view.",
  projectIdHint:
    "Optional: set VITE_DEFAULT_PROJECT_ID to your Postgres project UUID so grounding bundles and draft persistence use the same workspace as files and Bid control. Until then, the demo project id is used for API calls.",
  sectionNotFound:
    "This section is not in the current workspace. Return to the drafting studio and choose a section from the list.",
} as const;
