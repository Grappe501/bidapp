export type RunbookStep = {
  id: string;
  title: string;
  instructions: string;
  validationChecks: string[];
  requiredArtifacts: string[];
};

export const MOCK_SUBMISSION_RUNBOOK_STEPS: RunbookStep[] = [
  {
    id: "rb-001",
    title: "Log in to ARBuy",
    instructions:
      "Use the state-issued credentials for your organization. Confirm you are in the correct agency tenant before searching for the solicitation.",
    validationChecks: [
      "Session timeout policy acknowledged",
      "Correct legal entity profile selected",
    ],
    requiredArtifacts: ["ARBuy account access"],
  },
  {
    id: "rb-002",
    title: "Locate solicitation S000000479",
    instructions:
      "Search by solicitation number **S000000479** (Pharmacy Services for DHS HDCs). Open the active posting and verify due date and amendment count against your control center.",
    validationChecks: [
      "Solicitation number matches bid record",
      "No unreviewed amendments",
    ],
    requiredArtifacts: ["Solicitation record in Files"],
  },
  {
    id: "rb-003",
    title: "Upload required documents",
    instructions:
      "Upload each required volume and form in the order specified by the state. Use exact file naming from the output checklist. Do not substitute formats for the price workbook.",
    validationChecks: [
      "Technical PDFs within page limits",
      "Price workbook is state template",
      "EO policy attached",
      "Signature page present",
    ],
    requiredArtifacts: [
      "Experience / Solution / Risk PDFs",
      "Price sheet / workbook",
      "EO policy",
      "Subcontractor disclosure",
      "Redacted copy (if required)",
    ],
  },
  {
    id: "rb-004",
    title: "Verify file names and attachments",
    instructions:
      "In ARBuy, open each uploaded file for a quick sanity check (title page, no placeholder text). Confirm attachment list matches the mandatory checklist.",
    validationChecks: [
      "File names match internal manifest",
      "No duplicate stale versions",
      "Optional exhibits only if allowed",
    ],
    requiredArtifacts: ["Internal submission manifest"],
  },
  {
    id: "rb-005",
    title: "Confirm submission",
    instructions:
      "Complete the ARBuy attestation steps. Do not submit until the final validation gate is **PASS** in Bid Assembly and client approval is recorded.",
    validationChecks: [
      "Final gate PASS in system",
      "Client approval workflow step completed",
    ],
    requiredArtifacts: [],
  },
  {
    id: "rb-006",
    title: "Capture confirmation",
    instructions:
      "Save confirmation ID, timestamp, and a PDF/screenshot of the receipt. Paste notes into the submission execution log in Bid Assembly.",
    validationChecks: [
      "Confirmation ID stored",
      "Audit log updated",
      "Team notified informally (outside app)",
    ],
    requiredArtifacts: ["ARBuy confirmation artifact"],
  },
];

export function formatRunbookCopy(steps: RunbookStep[]): string {
  const lines: string[] = [
    "ARBuy submission runbook — S000000479",
    "====================================",
    "",
  ];
  for (const s of steps) {
    lines.push(`${s.title}`, "", s.instructions, "", "Validation:", ...s.validationChecks.map((c) => `  - ${c}`), "");
    if (s.requiredArtifacts.length) {
      lines.push("Artifacts:", ...s.requiredArtifacts.map((a) => `  - ${a}`), "");
    }
    lines.push("---", "");
  }
  return lines.join("\n");
}
