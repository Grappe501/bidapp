import type {
  ArchitectureOption,
  ContractRisk,
  DiscussionItem,
  DraftSection,
  DraftVersion,
  EvidenceItem,
  GroundedProseReviewResult,
  RedactionFlag,
  Requirement,
  RequirementEvidenceLink,
  RequirementSupportSummary,
  ReviewEntityType,
  ReviewIssue,
  ReviewIssueGroundedContext,
  ReviewIssueType,
  ReviewSeverity,
  SubmissionItem,
  Vendor,
} from "@/types";
import { computeRequirementSupportLevel, linksForRequirement } from "@/lib/evidence-utils";
import { SECTION_FOCUS } from "@/lib/drafting-utils";

export type BidReviewSnapshot = {
  projectId: string;
  requirements: Requirement[];
  evidenceLinks: RequirementEvidenceLink[];
  evidenceItems: EvidenceItem[];
  submissionItems: SubmissionItem[];
  discussionItems: DiscussionItem[];
  redactionFlags: RedactionFlag[];
  contractRisks: ContractRisk[];
  draftSections: DraftSection[];
  draftVersions: DraftVersion[];
  /** sectionId -> active version */
  activeDraftBySection: Record<string, DraftVersion | undefined>;
  vendors: Vendor[];
  architectureOptions: ArchitectureOption[];
  /** Combined draft text for heuristic scans */
  combinedDraftText: string;
  /** Merged proof-graph support per requirement (from drafting bundles). */
  requirementProofById?: Record<string, RequirementSupportSummary>;
  /** sectionId -> grounded prose review on active draft version */
  groundedProseBySectionId?: Record<
    string,
    GroundedProseReviewResult | null | undefined
  >;
};

const SUBMISSION_OK = new Set(["Ready", "Validated", "Submitted"]);

function isoNow(): string {
  return new Date().toISOString();
}

function issue(
  id: string,
  projectId: string,
  issueType: ReviewIssueType,
  severity: ReviewSeverity,
  title: string,
  description: string,
  entityType: ReviewEntityType,
  entityId: string,
  suggestedFix: string,
  groundedContext?: ReviewIssueGroundedContext,
): ReviewIssue {
  const t = isoNow();
  return {
    id,
    projectId,
    issueType,
    severity,
    title,
    description,
    entityType,
    entityId,
    status: "Open",
    suggestedFix,
    createdAt: t,
    updatedAt: t,
    groundedContext,
  };
}

function evidenceForLinks(
  links: RequirementEvidenceLink[],
  items: EvidenceItem[],
): EvidenceItem[] {
  const ids = new Set(links.map((l) => l.evidenceId));
  return items.filter((e) => ids.has(e.id));
}

function hasModeratePlusSupport(links: RequirementEvidenceLink[]): boolean {
  if (links.length === 0) return false;
  const level = computeRequirementSupportLevel(links);
  return level === "Moderate" || level === "Strong";
}

function reqTitle(req: Requirement, max = 72): string {
  return req.title.length > max ? `${req.title.slice(0, max - 1)}…` : req.title;
}

const CONTRACT_SENSITIVE_RE =
  /\b(sla|security|hipaa|phi|pii|breach|compliance|certif|contract|binding|warrant|indemnif|penalt|delivery|deadline|availability|uptime|integration|interface|api)\b/i;

function proseClaimSeverity(text: string, reason: string): ReviewSeverity {
  const blob = `${text} ${reason}`;
  if (CONTRACT_SENSITIVE_RE.test(blob)) {
    return "High";
  }
  if (blob.length > 120 && /\b(all|every|full|complete|guarantee)\b/i.test(blob)) {
    return "Moderate";
  }
  return "Moderate";
}

function contradictionSeverity(text: string, conflicts: string): ReviewSeverity {
  const blob = `${text} ${conflicts}`.toLowerCase();
  if (
    /\b(architecture|core\s+platform|enterprise\s+integration)\b/.test(blob) &&
    /\b(commit|guarantee|warrant|contractual)\b/.test(blob)
  ) {
    return "Critical";
  }
  if (
    /\b(now|live|production|deployed|operational)\b/.test(blob) &&
    /\b(plan|phase|roadmap|pending|future)\b/.test(blob)
  ) {
    return "High";
  }
  if (CONTRACT_SENSITIVE_RE.test(blob)) return "High";
  if (/\b(statewide|enterprise|all\s+members)\b/i.test(blob)) return "High";
  return "Moderate";
}

/** Grounded prose + proof-graph rules (BP-007 upgrade). */
function collectGroundedProseAndProofIssues(
  snapshot: BidReviewSnapshot,
): ReviewIssue[] {
  const out: ReviewIssue[] = [];
  const { projectId } = snapshot;
  const reqById = new Map(snapshot.requirements.map((r) => [r.id, r]));

  for (const sec of snapshot.draftSections) {
    const pr = snapshot.groundedProseBySectionId?.[sec.id];
    if (!pr) continue;

    const partialN = pr.requirement_findings.filter(
      (x) => x.status === "partially_addressed",
    ).length;

    for (const f of pr.requirement_findings) {
      const rmeta = reqById.get(f.requirement_id);
      const gctx: ReviewIssueGroundedContext = {
        requirementId: f.requirement_id,
        requirementTitle: rmeta?.title,
        proofLevel: f.support_level,
        proseReviewNote: f.notes,
      };
      if (f.status === "not_addressed") {
        const sev: ReviewSeverity =
          rmeta?.mandatory && rmeta.riskLevel === "Critical"
            ? "Critical"
            : rmeta?.mandatory
              ? "High"
              : "Moderate";
        out.push(
          issue(
            `rev:prose-not-addressed:${sec.id}:${f.requirement_id}`,
            projectId,
            "Requirement Not Addressed in Section",
            sev,
            `Draft does not address: ${rmeta?.title?.slice(0, 64) ?? f.requirement_id}`,
            f.notes || "Grounded prose review marked this requirement as not addressed in the section text.",
            "draft_section",
            sec.id,
            "Add explicit coverage tied to this requirement or document a deliberate scope boundary.",
            gctx,
          ),
        );
      } else if (
        f.status === "partially_addressed" &&
        rmeta?.riskLevel === "Critical"
      ) {
        out.push(
          issue(
            `rev:prose-partial-critical:${sec.id}:${f.requirement_id}`,
            projectId,
            "Requirement Not Addressed in Section",
            "High",
            `Only partial coverage for critical requirement: ${reqTitle(rmeta, 56)}`,
            f.notes ||
              "Critical requirement should be fully addressed for evaluators and protest defense.",
            "draft_section",
            sec.id,
            "Expand prose with mitigation, metrics, or evidence-backed proof for this requirement.",
            gctx,
          ),
        );
      }
    }

    pr.unsupported_claims.forEach((u, idx) => {
      const sev = proseClaimSeverity(u.text, u.reason);
      out.push(
        issue(
          `rev:prose-unsupported:${sec.id}:${idx}`,
          projectId,
          "Unsupported Claim",
          sev,
          `Unsupported claim (${sec.sectionType})`,
          u.reason || u.text.slice(0, 220),
          "draft_section",
          sec.id,
          u.suggested_fix || "Qualify, cite verified evidence, or remove until grounded.",
          {
            claimExcerpt: u.text.slice(0, 280),
            proseReviewNote: u.reason,
          },
        ),
      );
    });

    pr.contradictions.forEach((c, idx) => {
      const sev = contradictionSeverity(c.text, c.conflicts_with);
      out.push(
        issue(
          `rev:prose-contradiction:${sec.id}:${idx}`,
          projectId,
          "Draft Contradiction",
          sev,
          `Possible mismatch: ${sec.sectionType}`,
          c.explanation || `${c.text.slice(0, 120)} ↔ ${c.conflicts_with.slice(0, 120)}`,
          "draft_section",
          sec.id,
          "Reconcile draft language with vendor facts, architecture, or requirement proof before submission.",
          {
            claimExcerpt: c.text.slice(0, 280),
            conflictsWith: c.conflicts_with,
            sourceType: c.source_type,
            proseReviewNote: c.explanation,
          },
        ),
      );
    });

    if (
      partialN >= 3 &&
      (sec.sectionType === "Solution" ||
        sec.sectionType === "Interview" ||
        sec.sectionType === "Executive Summary")
    ) {
      out.push(
        issue(
          `rev:prose-weak-diff:${sec.id}`,
          projectId,
          "Weak Differentiation Support",
          "Moderate",
          `Many requirements only partially addressed in ${sec.sectionType}`,
          `${partialN} requirement(s) marked partially addressed — evaluators may read the volume as generic.`,
          "draft_section",
          sec.id,
          "Strengthen criterion-specific proof and reduce boilerplate so scored themes read distinct.",
        ),
      );
    }

    if (pr.confidence === "low") {
      const hasOther =
        pr.unsupported_claims.length > 0 ||
        pr.contradictions.length > 0 ||
        partialN > 0;
      if (hasOther || sec.status === "Approved") {
        out.push(
          issue(
            `rev:prose-low-confidence:${sec.id}`,
            projectId,
            "Low Confidence Draft",
            "Moderate",
            `Low model confidence in grounded review: ${sec.sectionType}`,
            "Grounded prose review reported low confidence — treat scoring posture as fragile until claims are verified.",
            "draft_section",
            sec.id,
            "Re-run review after proof graph and bundle updates; tighten unsupported language.",
          ),
        );
      }
    }

    if (sec.sectionType === "Solution" && pr.technical_density === "high") {
      out.push(
        issue(
          `rev:prose-tech-density:${sec.id}`,
          projectId,
          "Technical Density Risk",
          "Moderate",
          "Solution may be too technical for evaluator scoring",
          "Grounded review flagged high technical density — Solution scoring favors clarity and criterion fit.",
          "draft_section",
          sec.id,
          "Lead with outcomes and evaluation hooks; push deep stack detail to appendices if allowed.",
        ),
      );
    }

    if (sec.sectionType === "Experience" && pr.metrics_presence === "weak") {
      out.push(
        issue(
          `rev:prose-metrics:${sec.id}`,
          projectId,
          "Weak Metrics Presence",
          "Moderate",
          "Experience section may lack scored metrics",
          "Grounded review flagged weak metrics presence — past-performance scoring is evidence- and numbers-driven.",
          "draft_section",
          sec.id,
          "Add traceable metrics and references aligned to linked evidence.",
        ),
      );
    }

    if (sec.sectionType === "Risk") {
      const mitWeak = pr.improvement_actions.some((a) =>
        /mitigat|proof|evidence|gap/i.test(a),
      );
      const findingGap = pr.requirement_findings.some(
        (f) =>
          f.status !== "fully_addressed" &&
          /risk|mitigat|transition|implement/i.test(
            (reqById.get(f.requirement_id)?.title ?? "") + f.notes,
          ),
      );
      if (mitWeak || findingGap) {
        out.push(
          issue(
            `rev:prose-risk-mit:${sec.id}`,
            projectId,
            "Missing Mitigation Proof",
            "High",
            "Risk volume may under-prove mitigations",
            "Grounded review suggests mitigation or transition proof is thin relative to requirements.",
            "draft_section",
            sec.id,
            "Pair each material risk with mitigation, owner, and documented proof.",
          ),
        );
      }
    }
  }

  return out;
}

/** Deterministic rule scan — no AI. */
export function runReviewRules(snapshot: BidReviewSnapshot): ReviewIssue[] {
  const out: ReviewIssue[] = [];
  const { projectId } = snapshot;

  for (const req of snapshot.requirements) {
    const links = linksForRequirement(snapshot.evidenceLinks, req.id);
    const support = computeRequirementSupportLevel(links);
    const proof = snapshot.requirementProofById?.[req.id];

    if (proof) {
      if (proof.level === "none") {
        out.push(
          issue(
            `rev:proof-none:${req.id}`,
            projectId,
            "Weak Requirement Proof",
            req.mandatory ? "High" : "Moderate",
            `No proof-graph support: ${reqTitle(req)}`,
            "Requirement has proof level “none” in the merged bundle — link evidence and run build proof graph.",
            "requirement",
            req.id,
            "Attach verified or vendor-labeled evidence, sync the proof graph, and qualify draft claims.",
            {
              requirementId: req.id,
              requirementTitle: req.title,
              proofLevel: proof.level,
            },
          ),
        );
      } else if (proof.level === "weak") {
        out.push(
          issue(
            `rev:proof-weak:${req.id}`,
            projectId,
            "Weak Requirement Proof",
            req.mandatory ? "High" : "Moderate",
            `Weak proof support: ${reqTitle(req)}`,
            "Proof graph shows only weak support — evaluators may challenge scoring claims.",
            "requirement",
            req.id,
            "Strengthen verified evidence links or narrow claims until support improves.",
            {
              requirementId: req.id,
              requirementTitle: req.title,
              proofLevel: proof.level,
            },
          ),
        );
      } else if (
        proof.validation_mix.verified === 0 &&
        proof.validation_mix.vendor_claim > 0 &&
        proof.level !== "strong"
      ) {
        out.push(
          issue(
            `rev:proof-vendor-only:${req.id}`,
            projectId,
            "Over-Reliance on Vendor Claims",
            req.mandatory ? "High" : "Moderate",
            `Vendor-claim-only proof: ${reqTitle(req, 56)}`,
            "Linked proof rows are vendor-claim weighted without verified artifacts.",
            "requirement",
            req.id,
            "Obtain verified documentation or qualify operational promises in draft language.",
            {
              requirementId: req.id,
              requirementTitle: req.title,
              proofLevel: proof.level,
              evidenceSummary: `V${proof.validation_mix.verified} VC${proof.validation_mix.vendor_claim} U${proof.validation_mix.unverified}`,
            },
          ),
        );
      }

      if (
        req.mandatory &&
        req.riskLevel === "Critical" &&
        (proof.level === "weak" || proof.level === "partial")
      ) {
        out.push(
          issue(
            `rev:proof-critical-req:${req.id}`,
            projectId,
            "Weak Requirement Proof",
            "High",
            `Critical requirement with limited proof: ${reqTitle(req, 56)}`,
            `Proof level is ${proof.level}; critical obligations need defensible documentation.`,
            "requirement",
            req.id,
            "Prioritize verified evidence and explicit mitigation narrative for this requirement.",
            {
              requirementId: req.id,
              requirementTitle: req.title,
              proofLevel: proof.level,
            },
          ),
        );
      }

      for (const sec of snapshot.draftSections) {
        const v = snapshot.activeDraftBySection[sec.id];
        if (!v?.metadata.requirementCoverageIds.includes(req.id)) continue;
        if (proof.level === "none" || proof.level === "weak") {
          out.push(
            issue(
              `rev:draft-claim-weak-proof:${sec.id}:${req.id}`,
              projectId,
              "Weak Requirement Proof",
              req.mandatory ? "High" : "Moderate",
              `Draft claims coverage with thin proof: ${reqTitle(req, 48)}`,
              `Section metadata lists requirement coverage, but proof graph support is ${proof.level}.`,
              "draft_section",
              sec.id,
              "Either strengthen evidence and proof graph or soften draft claims for this requirement.",
              {
                requirementId: req.id,
                requirementTitle: req.title,
                proofLevel: proof.level,
              },
            ),
          );
        }
      }
    }

    if (!proof && links.length === 0) {
      out.push(
        issue(
          `rev:req-no-evidence:${req.id}`,
          projectId,
          "Missing Requirement Coverage",
          req.mandatory ? "High" : "Moderate",
          `No evidence linked: ${reqTitle(req)}`,
          `Requirement ${req.id} has zero linked evidence. Evaluators expect traceable support for scored criteria.`,
          "requirement",
          req.id,
          "Link at least one evidence item with documented support strength, or record an explicit waiver rationale in notes.",
        ),
      );
    } else if (!proof && (support === "None" || support === "Weak")) {
      out.push(
        issue(
          `rev:req-weak-support:${req.id}`,
          projectId,
          "Weak Evidence Support",
          req.mandatory ? "High" : "Moderate",
          `Weak / none support: ${reqTitle(req)}`,
          `Linked evidence exists but strongest link is ${support}. Mandatory and high-risk items should target Moderate+ where possible.`,
          "requirement",
          req.id,
          "Strengthen links (add exhibits, firm quotes) or downgrade claims in draft language until support improves.",
        ),
      );
    }

    if (
      req.mandatory &&
      (req.status === "Unresolved" || req.status === "Blocked")
    ) {
      out.push(
        issue(
          `rev:req-mandatory-unresolved:${req.id}`,
          projectId,
          "Missing Requirement Coverage",
          "Critical",
          `Mandatory requirement unresolved: ${req.title.slice(0, 64)}`,
          `Status is ${req.status}. Mandatory gaps are score and protest risk.`,
          "requirement",
          req.id,
          "Assign owner, capture decision path, and reflect coverage in Solution/Risk volumes.",
        ),
      );
    }

    if (req.mandatory && links.length > 0 && !hasModeratePlusSupport(links)) {
      const linkedEv = evidenceForLinks(links, snapshot.evidenceItems);
      const allUnverified = linkedEv.every(
        (e) =>
          e.validationStatus === "Unverified" ||
          e.validationStatus === "Pending Validation",
      );
      if (allUnverified && linkedEv.length > 0) {
        out.push(
          issue(
            `rev:req-mandatory-unverified-ev:${req.id}`,
            projectId,
            "Weak Evidence Support",
          "Moderate",
            `Mandatory item supported only by unverified evidence: ${req.title.slice(0, 56)}`,
            "All linked evidence is unverified or pending validation.",
            "requirement",
            req.id,
            "Validate key exhibits or qualify language until validation completes.",
          ),
        );
      }
    }
  }

  for (const sub of snapshot.submissionItems) {
    if (!sub.required) continue;
    if (!SUBMISSION_OK.has(sub.status)) {
      const sev: ReviewSeverity =
        sub.name.toLowerCase().includes("price") ||
        sub.name.toLowerCase().includes("pricing")
          ? "Critical"
          : "High";
      out.push(
        issue(
          `rev:sub-gap:${sub.id}`,
          projectId,
          "Submission Gap",
          sev,
          `Submission item not ready: ${sub.name}`,
          `Required item is "${sub.status}". Cost and compliance artifacts are disqualification-adjacent when wrong.`,
          "submission_item",
          sub.id,
          "Drive to Ready/Validated; confirm ARBuy naming and attachment rules.",
        ),
      );
    }
  }

  const criticalDisc = ["Scope of Work", "Risk Management Plan", "Payment Schedule", "Reporting Templates"];
  for (const d of snapshot.discussionItems) {
    if (criticalDisc.some((n) => d.name.includes(n)) && d.status === "Not Started") {
      out.push(
        issue(
          `rev:disc-gap:${d.id}`,
          projectId,
          "Discussion Readiness Gap",
          d.name.includes("Risk") ? "High" : "Moderate",
          `Discussion artifact not started: ${d.name}`,
          "Post-award negotiation depends on these documents aligning with written volumes.",
          "discussion_item",
          d.id,
          "Start draft in discussion workspace; mirror Risk/Solution commitments.",
        ),
      );
    }
  }

  const openRedactions = snapshot.redactionFlags.filter((f) => f.status === "Open");
  const redactedSub = snapshot.submissionItems.find((s) =>
    s.name.toLowerCase().includes("redacted"),
  );
  if (redactedSub && !SUBMISSION_OK.has(redactedSub.status) && openRedactions.length > 0) {
    out.push(
      issue(
        `rev:redaction-track:${redactedSub.id}`,
        projectId,
        "Redaction Risk",
        "Moderate",
        "Redacted copy incomplete while redaction flags are open",
        "FOIA posture requires tracked redactions before public-safe submission.",
      "submission_item",
        redactedSub.id,
        "Clear or update redaction flags and complete redacted package checklist.",
      ),
    );
  }

  for (const cr of snapshot.contractRisks) {
    if (cr.severity === "Critical" || cr.severity === "High") {
      out.push(
        issue(
          `rev:contract:${cr.id}`,
          projectId,
          "Contract Exposure",
          cr.severity === "Critical" ? "Critical" : "High",
          `Contract exposure: ${cr.category.slice(0, 64)}`,
          cr.description,
          "contract_risk",
          cr.id,
          "Map mitigations in Risk volume; ensure no draft promise exceeds SRV-1 posture.",
        ),
      );
    }
  }

  for (const sec of snapshot.draftSections) {
    const v = snapshot.activeDraftBySection[sec.id];
    if (v) {
      if (!v.groundingBundleId) {
        out.push(
          issue(
            `rev:draft-no-ground:${sec.id}`,
            projectId,
            "Unsupported Claim",
            "High",
            `Draft without grounding bundle: ${sec.sectionType}`,
            "Active version has no grounding_bundle_id — violates controlled drafting policy.",
          "draft_section",
            sec.id,
            "Attach a grounding bundle before treating content as submission-ready.",
          ),
        );
      }
      for (const flag of v.metadata.unsupportedClaimFlags) {
        out.push(
          issue(
            `rev:draft-unsupported:${sec.id}:${flag.slice(0, 24)}`,
            projectId,
            "Unsupported Claim",
            "Moderate",
            `Unsupported claim flag: ${sec.sectionType}`,
            flag,
            "draft_section",
            sec.id,
            "Verify, qualify, or remove claim; tie to evidence or vendor confirmation.",
          ),
        );
      }
      if (v.metadata.missingRequirementIds.length > 0) {
        out.push(
          issue(
            `rev:draft-missing-req:${sec.id}`,
            projectId,
            "Missing Requirement Coverage",
            "Moderate",
            `Draft metadata lists uncovered requirements (${v.metadata.missingRequirementIds.length})`,
            `IDs: ${v.metadata.missingRequirementIds.slice(0, 6).join(", ")}${v.metadata.missingRequirementIds.length > 6 ? "…" : ""}`,
            "draft_section",
            sec.id,
            "Close coverage gaps in matrix or adjust draft to address mandatory items.",
          ),
        );
      }
      const maxP = SECTION_FOCUS[sec.sectionType]?.maxPages ?? 2;
      if (v.metadata.estimatedPages > maxP + 0.05) {
        out.push(
          issue(
            `rev:draft-page:${sec.id}`,
            projectId,
            "Page Limit Risk",
            "High",
            `Page limit risk: ${sec.sectionType}`,
            `Estimated ${v.metadata.estimatedPages} pages vs ${maxP} max.`,
            "draft_section",
            sec.id,
            "Condense narrative; move detail to allowed attachments only.",
          ),
        );
      }
      const text = v.content.toLowerCase();
      if (sec.sectionType === "Experience") {
        const metricHints = ["%", "metric", "kpis", "sla", "turnaround", "accuracy"];
        const hits = metricHints.filter((m) => text.includes(m)).length;
        if (v.metadata.wordCount > 120 && hits < 2) {
          out.push(
            issue(
              `rev:exp-metrics:${sec.id}`,
              projectId,
              "Scoring Weakness",
              "Moderate",
              "Experience volume may lack concrete metrics",
              "Scoring emphasizes measurable past performance; draft is light on quantified outcomes.",
            "draft_section",
              sec.id,
              "Add traceable metrics tied to linked evidence (no fabrication).",
            ),
          );
        }
      }
      if (sec.sectionType === "Solution") {
        if (
          v.metadata.riskFlags.some((r) =>
            r.toLowerCase().includes("technical") || r.toLowerCase().includes("jargon"),
          ) ||
          /\b(api|json|hl7|fhir|microservice)\b/i.test(v.content)
        ) {
          out.push(
            issue(
              `rev:sol-clarity:${sec.id}`,
              projectId,
              "Scoring Weakness",
              "Moderate",
              "Solution may read overly technical for evaluators",
              "Solution scoring rewards non-technical clarity; stack depth without context can cost points.",
            "draft_section",
              sec.id,
              "Add evaluator-facing framing; push deep technical detail to appendices if allowed.",
            ),
          );
        }
      }
      if (sec.sectionType === "Risk") {
        const hasMitigation =
          text.includes("mitigat") ||
          text.includes("control") ||
          text.includes("contingency");
        if (v.metadata.wordCount > 80 && !hasMitigation) {
          out.push(
            issue(
              `rev:risk-mit:${sec.id}`,
              projectId,
              "Scoring Weakness",
              "High",
              "Risk section may lack explicit mitigation structure",
              "Risk scoring expects identification + mitigation + proof.",
            "draft_section",
              sec.id,
              "Name risks, mitigations, and evidence path for each major exposure.",
            ),
          );
        }
      }
    } else if (
      ["Experience", "Solution", "Risk"].includes(sec.sectionType) &&
      sec.status === "Not Started"
    ) {
      out.push(
        issue(
          `rev:section-not-started:${sec.id}`,
          projectId,
          "Scoring Weakness",
          "High",
          `Scored section not started: ${sec.sectionType}`,
          "Technical volumes are scored; missing sections default to zero on those factors.",
          "draft_section",
          sec.id,
          "Begin grounded draft for this section before color review.",
        ),
      );
    }
  }

  const primary = snapshot.vendors.filter((v) => v.category === "Primary Platform");
  for (const v of primary) {
    if (v.apiReadiness !== "High" && v.fitScore >= 4) {
      out.push(
        issue(
          `rev:vendor-api:${v.id}`,
          projectId,
          "Vendor Validation Gap",
          "Moderate",
          `API readiness not verified for primary partner: ${v.name}`,
          "Integration-heavy Arkansas Medicaid pharmacy scope needs defensible interface posture.",
          "vendor",
          v.id,
          "Obtain vendor confirmation or downgrade integration claims in architecture narrative.",
        ),
      );
    }
  }

  for (const opt of snapshot.architectureOptions) {
    const blob = `${opt.name} ${opt.summary} ${opt.notes} ${opt.malonePositionSummary}`.toLowerCase();
    if (
      (blob.includes("matrixcare") || blob.includes("interface commitment")) &&
      blob.includes("real-time")
    ) {
      const hasBacking = snapshot.evidenceItems.some(
        (e) =>
          e.excerpt.toLowerCase().includes("interface") ||
          e.title.toLowerCase().includes("integration"),
      );
      if (!hasBacking) {
        out.push(
          issue(
            `rev:arch-interface:${opt.id}`,
            projectId,
            "Architecture Risk",
            "High",
            "Architecture implies deep interface commitments without grounded evidence",
            "MatrixCare / eligibility-style interface language can become contractual if overstated.",
          "architecture_option",
            opt.id,
            "Ground claims in RFP + vendor evidence, or qualify as roadmap / design-dependent.",
          ),
        );
      }
    }
    if (blob.includes("cloud") || blob.includes("hosted")) {
      const grounded = snapshot.evidenceItems.some(
        (e) =>
          e.validationStatus === "Verified" &&
          (e.excerpt.toLowerCase().includes("host") ||
            e.title.toLowerCase().includes("security")),
      );
      if (!grounded) {
        out.push(
          issue(
            `rev:arch-hosting:${opt.id}`,
            projectId,
            "Unsupported Claim",
            "Moderate",
            "Hosting / cloud posture may lack verified evidence",
            "Security and privacy evaluators will probe residency and BAA posture.",
          "architecture_option",
            opt.id,
            "Attach compliance evidence or soften hosting claims pending validation.",
          ),
        );
      }
    }
  }

  const hay = `${snapshot.combinedDraftText} ${snapshot.architectureOptions.map((o) => o.summary).join(" ")}`.toLowerCase();
  if (hay.includes("matrixcare")) {
    const backed = snapshot.evidenceItems.some((e) =>
      e.excerpt.toLowerCase().includes("matrix"),
    );
    if (!backed) {
      out.push(
        issue(
          "rev:static-matrixcare",
          projectId,
          "Unsupported Claim",
          "High",
          "MatrixCare integration referenced without stored evidence",
          "Draft or architecture mentions MatrixCare; no matching evidence excerpt in vault.",
          "project",
          snapshot.projectId,
          "Add source-backed evidence or remove implied certification until validated.",
        ),
      );
    }
  }

  out.push(...collectGroundedProseAndProofIssues(snapshot));

  return out;
}
