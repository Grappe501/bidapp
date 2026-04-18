import type { Vendor } from "@/types";

const t0 = "2026-04-01T12:00:00.000Z";
const t1 = "2026-04-18T09:00:00.000Z";

export const MOCK_VENDORS: Vendor[] = [
  {
    id: "vendor-suite-rx",
    name: "SuiteRx",
    category: "Primary Platform",
    status: "Shortlisted",
    primaryContactName: "Jordan Ellis",
    primaryContactEmail: "j.ellis@suitex.example",
    primaryContactPhone: "+1-501-555-0142",
    summary:
      "Full-stack PBM platform with strong Medicaid footprint and mature claims engine. Leading candidate for primary system-of-record if timeline and integration depth align.",
    fitScore: 5,
    implementationSpeed: "Moderate",
    ltcFit: "High",
    apiReadiness: "Moderate",
    pricingNotes:
      "Per-member-per-month baseline competitive; implementation fees stepped by module. Volume discounts kick in above 400K lives.",
    likelyStackRole:
      "Primary adjudication and benefits platform; anchor for most volumes.",
    strengths: [
      "Deep Medicaid and LTC benefit configurations out of the box",
      "Established Arkansas-adjacent reference clients",
      "Mature 835/837 and real-time eligibility patterns",
    ],
    weaknesses: [
      "API surface narrower than best-of-breed integration vendors",
      "Customization cycles can extend delivery on edge scenarios",
    ],
    risks: [
      "Contracting bandwidth if multiple change orders surface mid-implementation",
    ],
    notes:
      "Position as defensible primary if we emphasize operational realism and in-state precedent.",
    capabilities: [
      {
        id: "cap-sr-1",
        statement: "Core claims, UM, and formulary with configurable edits",
      },
      {
        id: "cap-sr-2",
        statement: "Member and provider portals with configurable workflows",
      },
      {
        id: "cap-sr-3",
        statement: "Reporting suite aligned to state MMIS reporting cadence",
      },
    ],
    sourceFileIds: ["file-004"],
    createdAt: t0,
    updatedAt: t1,
  },
  {
    id: "vendor-evolved-rx",
    name: "EvolvedRx",
    category: "Workflow Automation",
    status: "Recommended",
    primaryContactName: "Priya Nair",
    primaryContactEmail: "pnair@evolvedrx.example",
    primaryContactPhone: "+1-312-555-0198",
    summary:
      "Workflow and care-management automation layer with strong prior-auth orchestration. Natural fit as control tower above core claims processing.",
    fitScore: 4,
    implementationSpeed: "High",
    ltcFit: "Moderate",
    apiReadiness: "High",
    pricingNotes:
      "Subscription by covered life band; professional services quoted separately for complex integrations.",
    likelyStackRole:
      "Workflow / PA orchestration and exception handling across vendor boundaries.",
    strengths: [
      "Fast time-to-value on PA and appeals workflows",
      "Strong API-first posture for event-driven integrations",
      "Clear UX for clinical reviewers",
    ],
    weaknesses: [
      "Not a full PBM replacement — needs strong core platform underneath",
      "Some Medicaid-specific edits require configuration sprints",
    ],
    risks: [
      "Overlap with SuiteRx UM if both deployed without crisp role boundaries",
    ],
    notes:
      "Default narrative: EvolvedRx as workflow/control layer with Malone coordinating cross-vendor policy.",
    capabilities: [
      {
        id: "cap-er-1",
        statement: "Prior authorization and appeals with SLA tracking",
      },
      {
        id: "cap-er-2",
        statement: "Configurable clinical rules and escalation paths",
      },
    ],
    sourceFileIds: ["file-004"],
    createdAt: t0,
    updatedAt: t1,
  },
  {
    id: "vendor-pharmesol",
    name: "Pharmesol",
    category: "Communication Automation",
    status: "Active Review",
    primaryContactName: "Marcus Webb",
    primaryContactEmail: "mwebb@pharmesol.example",
    primaryContactPhone: "+1-615-555-0167",
    summary:
      "Member and prescriber communication automation with IVR, SMS, and portal nudges. Strong for adherence and refill programs.",
    fitScore: 3,
    implementationSpeed: "High",
    ltcFit: "Moderate",
    apiReadiness: "High",
    pricingNotes:
      "Message bundles + per-trigger pricing; favorable for outreach-heavy evaluation criteria.",
    likelyStackRole:
      "Outbound/inbound engagement layer; complements core PBM communications.",
    strengths: [
      "Omnichannel templates with compliance guardrails",
      "Good analytics on campaign effectiveness",
    ],
    weaknesses: [
      "Less depth on clinical editing than workflow-first vendors",
      "LTC-specific scripting needs validation",
    ],
    risks: [
      "Vendor claim on 99.9% delivery — verify contractually before citing",
    ],
    notes: "Use as supporting comms automation, not as platform core.",
    capabilities: [
      {
        id: "cap-ph-1",
        statement: "Omnichannel member outreach with consent management",
      },
    ],
    sourceFileIds: ["file-004"],
    createdAt: t0,
    updatedAt: t1,
  },
  {
    id: "vendor-personal-med",
    name: "PersonalMed",
    category: "Financial Optimization",
    status: "Active Review",
    primaryContactName: "Elena Rostova",
    primaryContactEmail: "e.rostova@personalmed.example",
    primaryContactPhone: "+1-212-555-0134",
    summary:
      "Specialty and rebate optimization with analytics on ingredient cost and network leakage. Fits financial narrative and 340B-adjacent diligence.",
    fitScore: 4,
    implementationSpeed: "Moderate",
    ltcFit: "Moderate",
    apiReadiness: "Moderate",
    pricingNotes:
      "Gain-share optional on demonstrated savings; base platform fee plus analytics seats.",
    likelyStackRole:
      "Financial optimization and rebate intelligence; advisory dashboards for state oversight.",
    strengths: [
      "Credible specialty carve-out modeling",
      "Strong exportable reporting for audit conversations",
    ],
    weaknesses: [
      "Integration effort to pipe clean claims history from primary platform",
    ],
    risks: [
      "Gain-share structures can complicate procurement legal review",
    ],
    notes: "Pair with SuiteRx or similar for clean data feeds.",
    capabilities: [
      {
        id: "cap-pm-1",
        statement: "Rebate and specialty trend analytics with drill-down",
      },
    ],
    sourceFileIds: ["file-004", "file-003"],
    createdAt: t0,
    updatedAt: t1,
  },
  {
    id: "vendor-nexus-bridge",
    name: "NexusBridge",
    category: "Integration Layer",
    status: "Hold",
    primaryContactName: "Sam Okonkwo",
    primaryContactEmail: "s.okonkwo@nexusbridge.example",
    primaryContactPhone: "+1-404-555-0171",
    summary:
      "Integration hub for HL7/FHIR and legacy flat files. Consider if primary platform API gaps require a translation layer.",
    fitScore: 3,
    implementationSpeed: "Moderate",
    ltcFit: "Low",
    apiReadiness: "High",
    pricingNotes:
      "Connector-based pricing; can escalate TCO if many endpoints need custom mappings.",
    likelyStackRole:
      "Optional integration fabric between MMIS, PBM, and ancillary systems.",
    strengths: [
      "Large library of pre-built connectors",
      "Solid monitoring and replay for failed transactions",
    ],
    weaknesses: [
      "Another vendor in the critical path",
      "LTC-specific connectors may need custom build",
    ],
    risks: [
      "Latency and ownership blur when issues span hub vs endpoints",
    ],
    notes: "Keep on hold unless SuiteRx integration scope proves insufficient.",
    capabilities: [
      {
        id: "cap-nb-1",
        statement: "Managed connectors with transformation and observability",
      },
    ],
    sourceFileIds: [],
    createdAt: t0,
    updatedAt: t1,
  },
];
