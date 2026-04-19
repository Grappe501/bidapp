import { useMemo } from "react";
import { Card } from "@/components/ui/Card";
import { ClientArchitectureSnapshot } from "@/components/output/ClientArchitectureSnapshot";
import { ClientDecisionPanel } from "@/components/output/ClientDecisionPanel";
import { ClientNextActionsPanel } from "@/components/output/ClientNextActionsPanel";
import { ClientReadinessStrip } from "@/components/output/ClientReadinessStrip";
import { ClientRecommendationCard } from "@/components/output/ClientRecommendationCard";
import { ClientReviewDraftStatus } from "@/components/output/ClientReviewDraftStatus";
import { ClientReviewSummaryCard } from "@/components/output/ClientReviewSummaryCard";
import { WhyWinsCard } from "@/components/output/WhyWinsCard";
import { ClientRiskSnapshot } from "@/components/output/ClientRiskSnapshot";
import { OutputSubNav } from "@/components/output/OutputSubNav";
import { Button } from "@/components/ui/Button";
import { useArchitecture } from "@/context/useArchitecture";
import { useControl } from "@/context/useControl";
import { useOutput } from "@/context/useOutput";
import {
  buildClientNextActions,
  buildClientWatchouts,
  buildDraftPacketRows,
  buildUnresolvedDecisions,
  formatClientReviewPacketSummary,
  formatExecutiveSummaryCopy,
  formatNextActionsCopy,
  readinessHeadline,
} from "@/lib/client-review-utils";
import { copyTextToClipboard } from "@/lib/output-utils";

export function ClientReviewPage() {
  const { project, readiness, reviewIssues, reviewSnapshot } = useOutput();
  const { options } = useArchitecture();
  const { submissionItems } = useControl();

  const recommended = options.find((o) => o.recommended);

  const vendorStrategyLine = useMemo(() => {
    if (!recommended) {
      return "Define primary platform, intelligence layer, and supporting vendors in the architecture workspace — Malone remains the orchestration and governance lead.";
    }
    const core = recommended.components
      .filter((c) => !c.optional)
      .map((c) => `${c.vendorName} (${c.role})`);
    return `Malone-led orchestration; proposed core stack: ${core.join("; ")}.`;
  }, [recommended]);

  const watchouts = useMemo(
    () => buildClientWatchouts(reviewIssues, recommended, 3),
    [reviewIssues, recommended],
  );

  const watchoutsExtended = useMemo(
    () => buildClientWatchouts(reviewIssues, recommended, 5),
    [reviewIssues, recommended],
  );

  const nextActions = useMemo(
    () =>
      buildClientNextActions({
        issues: reviewIssues,
        submissionItems,
        readiness,
        recommended,
      }),
    [reviewIssues, submissionItems, readiness, recommended],
  );

  const decisions = useMemo(
    () => buildUnresolvedDecisions(reviewIssues, submissionItems),
    [reviewIssues, submissionItems],
  );

  const draftRows = useMemo(
    () =>
      buildDraftPacketRows(
        reviewSnapshot.draftSections,
        reviewSnapshot.activeDraftBySection,
        reviewIssues,
      ),
    [reviewSnapshot, reviewIssues],
  );

  const execSummaryText = useMemo(
    () =>
      formatExecutiveSummaryCopy({
        bidNumber: project.bidNumber,
        projectTitle: project.title,
        readiness,
        readinessNarrative: readinessHeadline(readiness.overall),
        recommendedName: recommended?.name,
        vendorStrategyLine,
        watchouts,
        nextActions: nextActions.slice(0, 3),
      }),
    [project, readiness, recommended, vendorStrategyLine, watchouts, nextActions],
  );

  const packetSummaryText = useMemo(
    () =>
      formatClientReviewPacketSummary({
        bidNumber: project.bidNumber,
        projectTitle: project.title,
        readiness,
        recommended,
        watchouts: watchoutsExtended,
        decisions,
        nextActions,
        draftRows,
      }),
    [
      project,
      readiness,
      recommended,
      watchoutsExtended,
      decisions,
      nextActions,
      draftRows,
    ],
  );

  return (
    <div className="px-4 py-6 sm:p-8">
      <div className="mx-auto w-full max-w-4xl space-y-8">
        <OutputSubNav />

        <header className="space-y-2 border-b border-border pb-6">
          <h1 className="text-2xl font-semibold tracking-tight text-ink">
            Client review packet
          </h1>
          <p className="max-w-3xl text-sm leading-relaxed text-ink-muted">
            Executive brief for{" "}
            <span className="font-medium text-ink">{project.bidNumber}</span>
            : current recommendation, rationale, strengths, open decisions, readiness,
            and next actions — for internal alignment and client readout.
          </p>
        </header>

        <div className="grid gap-4 sm:grid-cols-2">
          <Card className="border-slate-200/90 bg-slate-50/70 p-4">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
              Recommended operating approach
            </p>
            <p className="mt-2 text-sm leading-relaxed text-slate-800">
              {vendorStrategyLine}
            </p>
          </Card>
          <Card className="border-emerald-900/10 bg-emerald-50/40 p-4">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-emerald-900/70">
              Why this approach is strongest
            </p>
            <p className="mt-2 text-sm leading-relaxed text-slate-800">
              Alignment between documented capabilities, architecture choices, and
              solicitation emphasis — with traceability to requirements and evidence.
            </p>
          </Card>
          <Card className="border-slate-200/90 bg-white p-4 sm:col-span-2">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
              Top strengths
            </p>
            <ul className="mt-2 list-inside list-disc space-y-1 text-sm text-slate-700">
              <li>
                Structured traceability from requirements to evidence and draft sections.
              </li>
              <li>
                Evaluation-aligned architecture narrative for{" "}
                <span className="font-medium text-slate-800">{project.bidNumber}</span>.
              </li>
              {recommended ? (
                <li>
                  Coherent stack story anchored on {recommended.name} with explicit vendor
                  roles.
                </li>
              ) : (
                <li>Finalize a recommended architecture option to lock the solution story.</li>
              )}
            </ul>
          </Card>
          <Card className="border-slate-200/90 bg-white p-4 sm:col-span-2">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
              Next actions toward submission
            </p>
            <ul className="mt-2 space-y-1.5 text-sm text-slate-800">
              {nextActions.slice(0, 4).map((a) => (
                <li key={a.id} className="flex gap-2">
                  <span className="text-emerald-800" aria-hidden>
                    →
                  </span>
                  <span>{a.label}</span>
                </li>
              ))}
            </ul>
          </Card>
        </div>

        <ClientReviewSummaryCard
          bidNumber={project.bidNumber}
          projectTitle={project.title}
          readiness={readiness}
          readinessHeadlineText={readinessHeadline(readiness.overall)}
          recommendedOption={recommended}
          vendorStrategyLine={vendorStrategyLine}
          watchouts={watchouts}
          nextActions={nextActions.slice(0, 3)}
        />

        <WhyWinsCard bidNumber={project.bidNumber} />

        <ClientRecommendationCard option={recommended} />

        <ClientReviewDraftStatus rows={draftRows} />

        <ClientArchitectureSnapshot option={recommended} />

        <ClientDecisionPanel decisions={decisions} />

        <ClientRiskSnapshot issues={reviewIssues} fallbackWatchouts={watchouts} />

        <ClientReadinessStrip readiness={readiness} />

        <ClientNextActionsPanel actions={nextActions} />

        <div className="space-y-2 border-t border-border pt-6">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-ink-subtle">
            Export
          </p>
          <p className="text-xs text-ink-muted">
            Clipboard exports for email or offline readout.
          </p>
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="secondary"
              className="text-xs"
              onClick={() => void copyTextToClipboard(execSummaryText)}
            >
              Copy executive summary (text)
            </Button>
            <Button
              type="button"
              variant="secondary"
              className="text-xs"
              onClick={() => void copyTextToClipboard(formatNextActionsCopy(nextActions))}
            >
              Copy next actions (text)
            </Button>
            <Button
              type="button"
              variant="secondary"
              className="text-xs"
              onClick={() => void copyTextToClipboard(packetSummaryText)}
            >
              Copy client review packet (Markdown)
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
