import { useMemo } from "react";
import { ExportActionBar } from "@/components/output/ExportActionBar";
import { FinalBlockerList } from "@/components/output/FinalBlockerList";
import { FinalDecisionGate } from "@/components/output/FinalDecisionGate";
import { FinalReadinessActionPanel } from "@/components/output/FinalReadinessActionPanel";
import { FinalReadinessSummaryStrip } from "@/components/output/FinalReadinessSummaryStrip";
import { OutputSubNav } from "@/components/output/OutputSubNav";
import { useOutput } from "@/context/useOutput";
import { activeIssues } from "@/lib/review-utils";
import {
  buildFinalReadinessBlockers,
  buildFinalReadinessNextActions,
  computeFinalDecisionGate,
  computeRedactionReadinessScore,
} from "@/lib/output-utils";

export function FinalBundlePage() {
  const {
    readiness,
    reviewIssues,
    summary,
    redactionSummary,
    copyReadinessSummary,
    bundles,
    copyBundleJson,
    artifacts,
    reviewSnapshot,
  } = useOutput();

  const act = activeIssues(reviewIssues);
  const critical = act.filter((i) => i.severity === "Critical");

  const clientSignOffReady =
    critical.length === 0 && readiness.overall >= 68 && summary.outputBlockers <= 2;

  const submissionAssemblyReady =
    summary.outputBlockers === 0 &&
    redactionSummary.unresolvedCount === 0 &&
    redactionSummary.redactedCopyArtifactReady;

  const gate = useMemo(
    () =>
      computeFinalDecisionGate({
        criticalIssueCount: critical.length,
        clientSignOffReady,
        submissionAssemblyReady,
        readinessOverall: readiness.overall,
      }),
    [
      critical.length,
      clientSignOffReady,
      submissionAssemblyReady,
      readiness.overall,
    ],
  );

  const blockers = useMemo(
    () =>
      buildFinalReadinessBlockers({
        artifacts,
        reviewIssues,
        redactionSummary,
        snapshot: reviewSnapshot,
      }),
    [artifacts, reviewIssues, redactionSummary, reviewSnapshot],
  );

  const nextActions = useMemo(
    () => buildFinalReadinessNextActions({ gate, blockers, redactionSummary }),
    [gate, blockers, redactionSummary],
  );

  const redactionReadiness = useMemo(
    () => computeRedactionReadinessScore(redactionSummary),
    [redactionSummary],
  );

  const finalBundle = bundles.find((b) => b.bundleType === "Final Readiness Bundle");

  return (
    <div className="px-4 py-6 sm:p-8">
      <div className="mx-auto w-full max-w-5xl space-y-8">
        <OutputSubNav />

        <header className="space-y-2 border-b border-border pb-6">
          <h1 className="text-2xl font-semibold tracking-tight text-ink">
            Final readiness bundle
          </h1>
          <p className="max-w-3xl text-sm leading-relaxed text-ink-muted">
            Mission control for the last <span className="font-medium text-ink">go / no-go</span>{" "}
            decision: composite <span className="font-medium text-ink">readiness</span>,{" "}
            <span className="font-medium text-ink">blockers</span>, redaction posture, and{" "}
            <span className="font-medium text-ink">next actions</span> to reach a confident{" "}
            <span className="font-medium text-ink">final decision</span>.
          </p>
        </header>

        <FinalDecisionGate gate={gate} />

        <FinalReadinessSummaryStrip
          readiness={readiness}
          redactionReadiness={redactionReadiness}
        />

        <FinalBlockerList blockers={blockers} />

        <FinalReadinessActionPanel actions={nextActions} />

        <div className="space-y-2">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-ink-subtle">
            Export
          </h2>
          <ExportActionBar
            actions={[
              {
                label: "Copy readiness summary (text)",
                onClick: copyReadinessSummary,
              },
              ...(finalBundle
                ? [
                    {
                      label: "Copy final readiness bundle (JSON)",
                      onClick: () => copyBundleJson(finalBundle.id),
                    },
                  ]
                : []),
            ]}
          />
        </div>
      </div>
    </div>
  );
}
