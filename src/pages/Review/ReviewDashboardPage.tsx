import { Link } from "react-router-dom";
import { BidControlNav } from "@/components/control/BidControlNav";
import { ContractExposureCard } from "@/components/review/ContractExposureCard";
import { RequirementCoverageAuditCard } from "@/components/review/RequirementCoverageAuditCard";
import { ReviewSummaryCard } from "@/components/review/ReviewSummaryCard";
import { SectionReviewCard } from "@/components/review/SectionReviewCard";
import { SubmissionReadinessCard } from "@/components/review/SubmissionReadinessCard";
import { UnsupportedClaimCard } from "@/components/review/UnsupportedClaimCard";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { useReview } from "@/context/useReview";
import { useWorkspace } from "@/context/useWorkspace";
import { REVIEW_RULE_GROUPS } from "@/lib/review-catalog";
import { activeIssues, issueSummary } from "@/lib/review-utils";

export function ReviewDashboardPage() {
  const { project } = useWorkspace();
  const { allIssues, snapshot, runReview, readiness } = useReview();
  const act = activeIssues(allIssues);
  const s = issueSummary(allIssues);

  const criticalIds = act
    .filter((i) => i.severity === "Critical")
    .map((i) => i.id);

  return (
    <div className="p-8">
      <div className="mx-auto max-w-5xl space-y-8">
        <BidControlNav />

        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-ink">
              Review command center
            </h1>
            <p className="mt-2 max-w-3xl text-sm leading-relaxed text-ink-muted">
              Red-team pass on {project.bidNumber}: proof graph, grounded
              prose review, coverage, submission, contract posture, and discussion
              readiness — without panic UI.
            </p>
          </div>
          <Button type="button" variant="secondary" onClick={runReview}>
            Refresh scan
          </Button>
        </div>

        <ReviewSummaryCard
          issues={allIssues}
          title="Executive snapshot"
          subtitle="Active findings are Open or In review. Resolved and dismissed items stay auditable from the issues table."
        />

        <Card className="border-sky-200/60 bg-sky-50/30 p-4">
          <h2 className="text-sm font-semibold text-ink">Grounded intelligence</h2>
          <p className="mt-1 text-xs leading-relaxed text-ink-muted">
            Signals from proof-graph bundles attached in drafting and{" "}
            <code className="rounded bg-white/80 px-1">groundedProseReview</code> on
            active versions. Run sync proof graph → rebuild bundle → grounded review on
            draft sections for full fidelity.
          </p>
          <ul className="mt-3 grid gap-2 text-xs text-ink-muted sm:grid-cols-2">
            <li>
              <span className="font-medium text-ink">Weak proof issues:</span>{" "}
              {act.filter((i) => i.issueType === "Weak Requirement Proof").length}
            </li>
            <li>
              <span className="font-medium text-ink">Prose unsupported:</span>{" "}
              {s.proseUnsupportedCount}
            </li>
            <li>
              <span className="font-medium text-ink">Contradictions:</span>{" "}
              {s.contradictionCount}
            </li>
            <li>
              <span className="font-medium text-ink">Low-confidence sections:</span>{" "}
              {act.filter((i) => i.issueType === "Low Confidence Draft").length}
            </li>
          </ul>
        </Card>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <Card className="p-4">
            <p className="text-xs font-medium text-ink-subtle">Overall readiness</p>
            <p className="mt-1 text-3xl font-semibold tabular-nums text-ink">
              {readiness.overall}
            </p>
            <Link
              to="/review/readiness"
              className="mt-2 inline-block text-xs text-ink underline-offset-2 hover:underline"
            >
              Open readiness briefing →
            </Link>
          </Card>
          <Card className="p-4">
            <p className="text-xs font-medium text-ink-subtle">Submission blockers</p>
            <p className="mt-1 text-3xl font-semibold tabular-nums text-ink">
              {s.submissionBlockers}
            </p>
            <Link
              to="/control/submission"
              className="mt-2 inline-block text-xs text-ink-muted hover:text-ink"
            >
              Checklist →
            </Link>
          </Card>
          <Card className="p-4">
            <p className="text-xs font-medium text-ink-subtle">Scoring-risk flags</p>
            <p className="mt-1 text-3xl font-semibold tabular-nums text-ink">
              {s.scoringRisk}
            </p>
            <Link
              to="/drafts"
              className="mt-2 inline-block text-xs text-ink-muted hover:text-ink"
            >
              Drafts →
            </Link>
          </Card>
        </div>

        <div>
          <h2 className="text-sm font-semibold text-ink">Rule categories</h2>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            {REVIEW_RULE_GROUPS.map((g) => (
              <Card key={g.id} className="border-zinc-400/15 p-4">
                <h3 className="font-medium text-ink">{g.title}</h3>
                <p className="mt-2 text-xs leading-relaxed text-ink-muted">
                  {g.description}
                </p>
                <p className="mt-2 text-xs text-ink-subtle">
                  Signals: {g.issueTypes.join(" · ")}
                </p>
              </Card>
            ))}
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <RequirementCoverageAuditCard snapshot={snapshot} />
          <SubmissionReadinessCard snapshot={snapshot} />
          <SectionReviewCard snapshot={snapshot} />
          <UnsupportedClaimCard issues={allIssues} />
          <ContractExposureCard issues={allIssues} />
        </div>

        <Card className="space-y-3 p-4">
          <h2 className="text-sm font-semibold text-ink">Quick links</h2>
          <ul className="flex flex-wrap gap-3 text-sm">
            <li>
              <Link className="text-ink underline-offset-2 hover:underline" to="/review/issues">
                All issues
              </Link>
            </li>
            {criticalIds.length > 0 ? (
              <li>
                <Link
                  className="text-ink underline-offset-2 hover:underline"
                  to={`/review/issues/${encodeURIComponent(criticalIds[0]!)}`}
                >
                  First critical finding →
                </Link>
              </li>
            ) : null}
            <li>
              <Link className="text-ink underline-offset-2 hover:underline" to="/review/readiness">
                Readiness briefing
              </Link>
            </li>
          </ul>
        </Card>
      </div>
    </div>
  );
}
