import { useMemo } from "react";
import { ExportActionBar } from "@/components/output/ExportActionBar";
import { EvaluatorScorecard } from "@/components/review/EvaluatorScorecard";
import { FinalBlockerList } from "@/components/output/FinalBlockerList";
import { FinalReadinessActionPanel } from "@/components/output/FinalReadinessActionPanel";
import { FinalReadinessGateCard } from "@/components/output/FinalReadinessGateCard";
import { FinalReadinessSummaryStrip } from "@/components/output/FinalReadinessSummaryStrip";
import { NarrativeAlignmentSummary } from "@/components/output/NarrativeAlignmentSummary";
import { OutputSubNav } from "@/components/output/OutputSubNav";
import { SubmitBlockerMatrix } from "@/components/output/SubmitBlockerMatrix";
import { ArbuySolicitationStatus } from "@/components/output/ArbuySolicitationStatus";
import { TechnicalProposalPacketStatus } from "@/components/output/TechnicalProposalPacketStatus";
import { useOutput } from "@/context/useOutput";
import type { FinalDecisionGate } from "@/lib/output-utils";
import {
  buildFinalReadinessBlockers,
  buildFinalReadinessNextActions,
  computeRedactionReadinessScore,
} from "@/lib/output-utils";

export function FinalBundlePage() {
  const {
    readiness,
    reviewIssues,
    redactionSummary,
    copyReadinessSummary,
    bundles,
    copyBundleJson,
    artifacts,
    reviewSnapshot,
    evaluatorSimulation,
    finalReadinessGate,
    technicalProposalPacketCompliance,
    arbuySolicitationCompliance,
    narrativeAlignmentResult,
  } = useOutput();

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

  const nextActions = useMemo(() => {
    const pseudoGate: FinalDecisionGate = {
      state:
        finalReadinessGate.overallState === "ready_to_submit"
          ? "ready_submission_assembly"
          : finalReadinessGate.overallState === "blocked"
            ? "blocked"
            : finalReadinessGate.overallState === "ready_with_risk"
              ? "ready_client_signoff"
              : "not_ready",
      headline: finalReadinessGate.submissionRecommendation,
      subline: "",
    };
    return buildFinalReadinessNextActions({
      gate: pseudoGate,
      blockers,
      redactionSummary,
    });
  }, [finalReadinessGate, blockers, redactionSummary]);

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

        <FinalReadinessGateCard gate={finalReadinessGate} />

        <NarrativeAlignmentSummary result={narrativeAlignmentResult} />

        <TechnicalProposalPacketStatus compliance={technicalProposalPacketCompliance} />

        <ArbuySolicitationStatus compliance={arbuySolicitationCompliance} />

        <EvaluatorScorecard result={evaluatorSimulation} />

        <SubmitBlockerMatrix blockers={finalReadinessGate.blockers} />

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
