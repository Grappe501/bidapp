import { MOCK_PROJECT } from "@/data/mockProject";
import type { CompetitorProfile } from "@/types";

const pid = MOCK_PROJECT.id;
const t = "2026-04-18T10:00:00.000Z";

export const MOCK_COMPETITORS: CompetitorProfile[] = [
  {
    id: "comp-incumbent-placeholder",
    projectId: pid,
    name: "Incumbent / local LTC pharmacy (placeholder)",
    competitorType: "Incumbent Pharmacy",
    likelyStatus: "Strong Threat",
    incumbent: true,
    summary:
      "If an incumbent serves all or part of the HDC pharmacy footprint, they carry continuity narrative, existing workflows, and relationship capital — even when integration depth is uneven.",
    likelyStrengths: [
      "On-site familiarity and existing staffing relationships",
      "Historical run-rate data the state already trusts",
      "Lower perceived transition risk in Experience scoring",
    ],
    likelyWeaknesses: [
      "May be weak on MatrixCare-forward integration timelines",
      "Innovation story may look like “more of the same”",
      "Risk volume may under-specify mitigation for new compliance asks",
    ],
    likelyPositioning:
      "Likely to emphasize stability, “we already know the members,” and minimal disruption — may downplay interface modernization.",
    threatLevel: "High",
    evidenceCharacter: "Judgment",
    evidenceBasis:
      "Judgment: typical incumbent pattern for Medicaid LTC pharmacy RFPs; validate against any public award history or amendments.",
    threatInterpretation:
      "Scores strongly on Experience if evaluators overweight continuity; can compress your differentiation window if you look “riskier” on transition.",
    counterPositioningNotes:
      "Frame Malone + partners as continuity-preserving intelligence — not rip-and-replace — with explicit cutover, staffing, and reporting guarantees tied to evidence.",
    notes: "Replace placeholder with sourced intel when available.",
    createdAt: t,
    updatedAt: t,
  },
  {
    id: "comp-regional-ltc",
    projectId: pid,
    name: "Regional LTC pharmacy operator (likely bidder)",
    competitorType: "Regional LTC Pharmacy",
    likelyStatus: "Likely Bidder",
    incumbent: false,
    summary:
      "Regional players often blend Medicaid discipline with agile account teams; they may bid aggressively on price while keeping narratives practical.",
    likelyStrengths: [
      "Responsive leadership and state-adjacent references",
      "Lean operations narrative for cost realism",
      "Can credibly claim 24/7 coverage if backed by contract language",
    ],
    likelyWeaknesses: [
      "Integration stack may be thinner than national + overlay model",
      "May struggle to show enterprise-grade analytics without partners",
    ],
    likelyPositioning:
      "“We know Arkansas-adjacent Medicaid” + cost discipline + personal service.",
    threatLevel: "Moderate",
    evidenceCharacter: "Inferred",
    evidenceBasis:
      "Inferred from typical field for S000000479 class solicitations; no specific bidder confirmed in-app.",
    threatInterpretation:
      "Could split Experience and Solution scores if evaluators favor regional proximity over architecture depth.",
    counterPositioningNotes:
      "Lead with MatrixCare readiness, auditability, and Malone oversight as measurable differentiators — not slogans.",
    notes: "",
    createdAt: t,
    updatedAt: t,
  },
  {
    id: "comp-national-ltc",
    projectId: pid,
    name: "National LTC pharmacy (scale play)",
    competitorType: "National LTC Pharmacy",
    likelyStatus: "Likely Bidder",
    incumbent: false,
    summary:
      "National footprint competitors lead on standardization, volume pricing, and brand — but can look templated or slow on state-specific integration.",
    likelyStrengths: [
      "Brand recognition and broad reference base",
      "Mature PBM-style reporting packages",
      "Pricing mechanics that look disciplined on paper",
    ],
    likelyWeaknesses: [
      "May propose generic transition without HDC-specific detail",
      "MatrixCare timelines may be optimistic unless proven",
    ],
    likelyPositioning:
      "“Proven at scale” — emphasizes process, SLAs, and national bench depth.",
    threatLevel: "High",
    evidenceCharacter: "Inferred",
    evidenceBasis:
      "Inferred competitive archetype; validate against known national vendors active in Arkansas Medicaid.",
    threatInterpretation:
      "Strong on Solution structure and cost narrative; Risk may be vulnerable if they over-promise standard playbooks.",
    counterPositioningNotes:
      "Use Arkansas Medicaid complexity, interface realism, and interview-ready risk detail to outflank template responses.",
    notes: "",
    createdAt: t,
    updatedAt: t,
  },
  {
    id: "comp-tech-light",
    projectId: pid,
    name: "Tech-light traditional operator",
    competitorType: "Regional LTC Pharmacy",
    likelyStatus: "Secondary Threat",
    incumbent: false,
    summary:
      "Traditional operators may under-invest in integration narrative — competitive if price is sharp, weak if evaluators weight interoperability.",
    likelyStrengths: [
      "Simple story: low change, predictable operations",
      "Potentially aggressive unit economics",
    ],
    likelyWeaknesses: [
      "Weak on MatrixCare / data exchange depth",
      "Reporting and analytics may look dated vs. state direction",
    ],
    likelyPositioning:
      "“Keep pharmacy boring and cheap” — minimal change, maximum compliance language.",
    threatLevel: "Moderate",
    evidenceCharacter: "Judgment",
    evidenceBasis:
      "Judgment: archetype for bidders that minimize IT scope; not tied to a named entity.",
    threatInterpretation:
      "Could capture cost points but lose Solution/Experience if scoring rewards modernization.",
    counterPositioningNotes:
      "Tie your Solution to solicitation language on interfaces, oversight, and measurable outcomes — not technology for its own sake.",
    notes: "",
    createdAt: t,
    updatedAt: t,
  },
  {
    id: "comp-pbm-ms",
    projectId: pid,
    name: "PBM / managed services consolidator",
    competitorType: "PBM / Managed Services",
    likelyStatus: "Unclear",
    incumbent: false,
    summary:
      "Some PBMs or managed service wrappers may appear as primes or hidden subs — watch for pricing elegance masking integration risk.",
    likelyStrengths: [
      "Financial engineering and rebate language",
      "National contracting templates",
    ],
    likelyWeaknesses: [
      "May be thin on Arkansas Medicaid operational nuance",
      "Subcontractor complexity can hurt Risk if not transparent",
    ],
    likelyPositioning:
      "“Total cost stewardship” with packaged network and analytics.",
    threatLevel: "Moderate",
    evidenceCharacter: "Inferred",
    evidenceBasis:
      "Inferred from market structure; confirm via subcontractor disclosures when published.",
    threatInterpretation:
      "If they prime, they can dominate cost narrative; transparency and defensibility become your wedge.",
    counterPositioningNotes:
      "Emphasize clear stack roles, audit trail, and Malone governance — make hidden complexity visible and controlled.",
    notes: "",
    createdAt: t,
    updatedAt: t,
  },
];
