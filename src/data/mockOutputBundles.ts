import type { OutputBundleType } from "@/types";

/** Display hints when deriving bundles from live data; bundles are assembled in `output-utils`. */
export const MOCK_OUTPUT_BUNDLE_LABELS: Record<OutputBundleType, string> = {
  "Submission Package": "Proposal submission assembly",
  "Client Review Packet": "Client review packet",
  "Redacted Packet": "FOIA / public records packet",
  "Final Readiness Bundle": "Final readiness & go / no-go",
  "Discussion Packet": "Discussion-phase workbook",
};
