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
            Submission package &amp; readiness
          </h1>
          <p className="max-w-3xl text-sm leading-relaxed text-ink-muted">
            Finalization workspace:{" "}
            <span className="font-medium text-ink">readiness</span>,{" "}
            <span className="font-medium text-ink">blockers</span>, and the primary
            deliverable bundles — client review packet, submission package, redacted
            packet, and final readiness bundle. Artifact workflow uses the same labels
            everywhere: Draft → In Progress → Ready → Validated → Locked.
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
            Compare deliverable bundles at a glance. Packaging blockers count artifacts
            not yet Ready, Validated, or Locked.
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

        <details className="rounded-lg border border-zinc-200/80 bg-zinc-50/50">
          <summary className="cursor-pointer px-4 py-3 text-sm font-medium text-ink">
            Clipboard &amp; checklist tools
          </summary>
          <div className="border-t border-zinc-200/70 px-4 pb-4 pt-2">
            <OutputQuickActionPanel
              onCopyReadiness={() => void copyReadinessSummary()}
              onCopyChecklist={() => void copyChecklistSummary()}
            />
          </div>
        </details>

        <p className="text-xs leading-relaxed text-ink-subtle">
          <span className="font-medium text-ink">Readiness</span> scores come from the
          review workspace. This page orients packaging work around the four primary
          bundles — it does not replace the review model.
        </p>
      </div>
    </div>
  );
}
