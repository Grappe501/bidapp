import { useMemo } from "react";
import { OutputAttentionPanel } from "@/components/output/OutputAttentionPanel";
import { OutputBundleCard } from "@/components/output/OutputBundleCard";
import { OutputCommandSummary } from "@/components/output/OutputCommandSummary";
import { OutputQuickActionPanel } from "@/components/output/OutputQuickActionPanel";
import { OutputReadinessStrip } from "@/components/output/OutputReadinessStrip";
import { OutputSubNav } from "@/components/output/OutputSubNav";
import { useOutput } from "@/context/useOutput";
import {
  buildOutputAttentionItems,
  computeBundleSuitability,
  OUTPUT_READINESS_STRIP_TYPES,
} from "@/lib/output-utils";
import { issueSummary } from "@/lib/review-utils";
import type { OutputBundle, OutputBundleType } from "@/types";

const BUNDLE_PAGE_ORDER: OutputBundleType[] = [
  ...OUTPUT_READINESS_STRIP_TYPES,
  "Discussion Packet",
];

function sortBundles(list: OutputBundle[]): OutputBundle[] {
  return [...list].sort(
    (a, b) =>
      BUNDLE_PAGE_ORDER.indexOf(a.bundleType) -
      BUNDLE_PAGE_ORDER.indexOf(b.bundleType),
  );
}

export function OutputCenterPage() {
  const {
    bundles,
    packagingByBundle,
    summary,
    artifacts,
    redactionSummary,
    readiness,
    reviewIssues,
    copyChecklistSummary,
    copyReadinessSummary,
  } = useOutput();

  const iss = useMemo(() => issueSummary(reviewIssues), [reviewIssues]);

  const submissionBundle = bundles.find(
    (b) => b.bundleType === "Submission Package",
  );
  const clientBundle = bundles.find(
    (b) => b.bundleType === "Client Review Packet",
  );
  const finalBundle = bundles.find(
    (b) => b.bundleType === "Final Readiness Bundle",
  );

  const submissionPackageComplete = submissionBundle
    ? (packagingByBundle[submissionBundle.id]?.complete ?? false)
    : false;
  const clientPacketComplete = clientBundle
    ? (packagingByBundle[clientBundle.id]?.complete ?? false)
    : false;
  const finalBundleComplete = finalBundle
    ? (packagingByBundle[finalBundle.id]?.complete ?? false)
    : false;

  const attentionItems = useMemo(
    () =>
      buildOutputAttentionItems({
        artifacts,
        bundles,
        packagingByBundle,
        redactionSummary,
        readiness,
        reviewIssues,
      }),
    [
      artifacts,
      bundles,
      packagingByBundle,
      redactionSummary,
      readiness,
      reviewIssues,
    ],
  );

  const sortedBundles = useMemo(() => sortBundles(bundles), [bundles]);

  return (
    <div className="px-4 py-6 sm:p-8">
      <div className="mx-auto w-full max-w-6xl space-y-8">
        <OutputSubNav />

        <header className="space-y-2 border-b border-border pb-6">
          <h1 className="text-2xl font-semibold tracking-tight text-ink">
            Output center
          </h1>
          <p className="max-w-3xl text-sm leading-relaxed text-ink-muted">
            Final packaging and <span className="font-medium text-ink">readiness</span>{" "}
            — what is on track, what is{" "}
            <span className="font-medium text-ink">blocked</span>, and what belongs in
            the <span className="font-medium text-ink">client review packet</span>,{" "}
            <span className="font-medium text-ink">submission package</span>,{" "}
            <span className="font-medium text-ink">redacted packet</span>, or{" "}
            <span className="font-medium text-ink">final readiness bundle</span>. Artifact
            workflow uses the same labels everywhere: Draft → In Progress → Ready →
            Validated → Locked.
          </p>
        </header>

        <OutputCommandSummary
          summary={summary}
          readiness={readiness}
          reviewIssues={reviewIssues}
          submissionPackageComplete={submissionPackageComplete}
          clientPacketComplete={clientPacketComplete}
          redactionUnresolved={redactionSummary.unresolvedCount}
          finalBundleComplete={finalBundleComplete}
        />

        <OutputReadinessStrip
          bundles={bundles}
          packagingByBundle={packagingByBundle}
          redactionUnresolved={redactionSummary.unresolvedCount}
          criticalIssueCount={iss.critical}
        />

        <section className="space-y-3">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-ink-subtle">
            Bundles
          </h2>
          <p className="max-w-3xl text-xs leading-relaxed text-ink-muted">
            Compare the <span className="font-medium text-ink">submission package</span>,{" "}
            <span className="font-medium text-ink">client review packet</span>,{" "}
            <span className="font-medium text-ink">redacted packet</span>, and{" "}
            <span className="font-medium text-ink">final readiness bundle</span> at a
            glance. Packaging <span className="font-medium text-ink">blockers</span> count
            artifacts not yet Ready, Validated, or Locked.
          </p>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {sortedBundles.map((b) => (
              <OutputBundleCard
                key={b.id}
                bundle={b}
                completeness={packagingByBundle[b.id]}
                suitability={computeBundleSuitability(
                  b.bundleType,
                  b.status,
                  packagingByBundle[b.id],
                  iss.critical,
                  readiness.overall,
                )}
                redactionUnresolved={redactionSummary.unresolvedCount}
              />
            ))}
          </div>
        </section>

        <OutputAttentionPanel items={attentionItems} />

        <OutputQuickActionPanel
          onCopyReadiness={() => void copyReadinessSummary()}
          onCopyChecklist={() => void copyChecklistSummary()}
        />

        <p className="text-xs leading-relaxed text-ink-subtle">
          <span className="font-medium text-ink">Readiness</span> scores come from the
          review workspace (BP-007). This page does not replace that model — it orients
          packaging work around the four primary bundles above.
        </p>
      </div>
    </div>
  );
}
