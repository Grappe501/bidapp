import { Link } from "react-router-dom";
import { BidControlNav } from "@/components/control/BidControlNav";
import { ContractExposureCard } from "@/components/review/ContractExposureCard";
import { EvaluatorScorecard } from "@/components/review/EvaluatorScorecard";
import { TechnicalProposalPacketStatus } from "@/components/output/TechnicalProposalPacketStatus";
import { ReadinessScoreCard } from "@/components/review/ReadinessScoreCard";
import { RequirementCoverageAuditCard } from "@/components/review/RequirementCoverageAuditCard";
import { SubmissionReadinessCard } from "@/components/review/SubmissionReadinessCard";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { useReview } from "@/context/useReview";
import { useControl } from "@/context/useControl";
import { NarrativeAlignmentCard } from "@/components/review/NarrativeAlignmentCard";
import { useOutput } from "@/context/useOutput";
import { useWorkspace } from "@/context/useWorkspace";
import { activeIssues, issueSummary } from "@/lib/review-utils";

export function ReadinessPage() {
  const { project } = useWorkspace();
  const {
    evaluatorSimulation,
    technicalProposalPacketCompliance,
    narrativeAlignmentResult,
  } = useOutput();
  const { readiness, allIssues, snapshot, runReview } = useReview();
  const { redactionFlags } = useControl();
  const act = activeIssues(allIssues);
  const sum = issueSummary(allIssues);
  const openRedaction = redactionFlags.filter((f) => f.status === "Open");

  return (
    <div className="p-8">
      <div className="mx-auto max-w-5xl space-y-8">
        <BidControlNav />

        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-ink">Bid readiness</h1>
            <p className="mt-2 max-w-3xl text-sm text-ink-muted">
              Weighted composite for {project.bidNumber}. Inputs now include
              proof-graph support and grounded prose review on drafts — still not a
              prediction of evaluation outcome, but harder to inflate with surface
              completeness alone.
            </p>
          </div>
          <Button type="button" variant="secondary" onClick={runReview}>
            Recompute
          </Button>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <ReadinessScoreCard
            label="Overall"
            value={readiness.overall}
            explanation="Blend of submission, coverage, grounding, scoring alignment, contract, and discussion dimensions."
          />
          <ReadinessScoreCard
            label="Submission"
            value={readiness.submission}
            explanation="Required checklist rows reaching Ready / Validated / Submitted."
          />
          <ReadinessScoreCard
            label="Coverage"
            value={readiness.coverage}
            explanation="Mandatory matrix health blended with proof-graph strong/partial support when bundles expose requirementSupport."
          />
          <ReadinessScoreCard
            label="Grounding"
            value={readiness.grounding}
            explanation="Grounded sections and evidence density, discounted by prose unsupported claims, contradictions, and low-confidence reviews."
          />
          <ReadinessScoreCard
            label="Scoring alignment"
            value={readiness.scoring_alignment}
            explanation="Page limits, legacy scoring heuristics, and grounded quality signals (metrics, technical density, mitigation proof, confidence)."
          />
          <ReadinessScoreCard
            label="Contract readiness"
            value={readiness.contract_readiness}
            explanation="Contract/architecture register issues plus high-stakes unsupported claims and contradictions."
          />
          <ReadinessScoreCard
            label="Discussion readiness"
            value={readiness.discussion_readiness}
            explanation="Core post-award documents moved past Not Started."
          />
        </div>

        <EvaluatorScorecard result={evaluatorSimulation} />

        <NarrativeAlignmentCard result={narrativeAlignmentResult} />

        <TechnicalProposalPacketStatus compliance={technicalProposalPacketCompliance} />

        <Card className="space-y-2 border-zinc-400/20 p-4">
          <h2 className="text-sm font-semibold text-ink">Executive checks</h2>
          <ul className="list-inside list-disc text-sm text-ink-muted">
            <li>
              Active findings: {act.length} —{" "}
              <Link to="/review/issues" className="text-ink underline">
                triage table
              </Link>
            </li>
            <li>
              Grounded signals: {sum.groundedFindingCount} open · contradictions{" "}
              {sum.contradictionCount} · prose-unsupported {sum.proseUnsupportedCount}
            </li>
            <li>Open redaction flags: {openRedaction.length}</li>
            <li>
              Drafting workspace:{" "}
              <Link to="/drafts" className="text-ink underline">
                /drafts
              </Link>{" "}
              (proof graph + grounded review)
            </li>
          </ul>
        </Card>

        <div className="grid gap-6 lg:grid-cols-2">
          <SubmissionReadinessCard snapshot={snapshot} />
          <RequirementCoverageAuditCard snapshot={snapshot} />
          <ContractExposureCard issues={allIssues} />
        </div>
      </div>
    </div>
  );
}
