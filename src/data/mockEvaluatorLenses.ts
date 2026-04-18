import { MOCK_PROJECT } from "@/data/mockProject";
import type { EvaluatorLens } from "@/types";

const pid = MOCK_PROJECT.id;
const t = "2026-04-18T12:00:00.000Z";

export const MOCK_EVALUATOR_LENSES: EvaluatorLens[] = [
  {
    id: "lens-001",
    projectId: pid,
    title: "Reliability / Operations Lens",
    description:
      "Evaluators ask whether members will get medications on time, every time — especially after hours and in emergencies.",
    likelyConcerns: [
      "Missed or delayed medications",
      "2-hour urgent delivery credibility",
      "Staffing continuity and pharmacy coverage",
      "Operational realism under Medicaid volume swings",
    ],
    likelyValueSignals: [
      "Clear SLAs with escalation paths",
      "After-hours model that survives interview probes",
      "Past performance with measurable outcomes",
    ],
    strategicResponse:
      "Anchor Experience and Risk to operational proof points — not adjectives. Tie Malone to exception resolution and audit visibility.",
    createdAt: t,
    updatedAt: t,
  },
  {
    id: "lens-002",
    projectId: pid,
    title: "Compliance / Risk Lens",
    description:
      "Evaluators protect the state from legal, privacy, and contractual exposure — weak Risk volumes lose fast.",
    likelyConcerns: [
      "HIPAA / HITECH and breach response",
      "Audit trail for decisions and overrides",
      "Contractual reliability and flow-down clarity",
      "Subcontractor governance",
    ],
    likelyValueSignals: [
      "Explicit controls mapped to solicitation",
      "Transparent subprocessors and data flows",
      "Risk mitigations with owners and triggers",
    ],
    strategicResponse:
      "Make Risk the defensibility spine: mitigations, monitoring, and interview-consistent accountability. Avoid unverifiable absolutes.",
    createdAt: t,
    updatedAt: t,
  },
  {
    id: "lens-003",
    projectId: pid,
    title: "Cost / Fiscal Stewardship Lens",
    description:
      "Evaluators want realism — disciplined pricing, clean billing, and defensible cost narrative for Arkansas Medicaid.",
    likelyConcerns: [
      "Cost realism vs low-ball bids",
      "Billing accuracy and NADAC alignment",
      "Hidden fees or unbounded change orders",
      "Total cost of ownership across contract life",
    ],
    likelyValueSignals: [
      "Transparent pricing workbook discipline",
      "Waste avoidance and audit-friendly reporting",
      "Financial controls that match operational story",
    ],
    strategicResponse:
      "Pair Solution cost narrative with operational depth — show how discipline is executed, not just promised.",
    createdAt: t,
    updatedAt: t,
  },
  {
    id: "lens-004",
    projectId: pid,
    title: "Innovation / Future-State Lens",
    description:
      "Evaluators may reward modernization — but only when it reduces risk and improves oversight (MatrixCare, analytics, automation).",
    likelyConcerns: [
      "MatrixCare integration timelines",
      "Whether “innovation” creates new failure modes",
      "Data analytics that actually support oversight",
      "Vendor lock-in and sustainability",
    ],
    likelyValueSignals: [
      "Realistic interface plan with measurable milestones",
      "Analytics that map to state reporting needs",
      "Architecture that preserves stable cores",
    ],
    strategicResponse:
      "Position Malone + partners as future-ready governance: smarter oversight without rip-and-replace drama. Keep claims grounded in evidence.",
    createdAt: t,
    updatedAt: t,
  },
];
