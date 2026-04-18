import { useMemo } from "react";
import { ExportActionBar } from "@/components/output/ExportActionBar";
import { OutputSubNav } from "@/components/output/OutputSubNav";
import { PackageArtifactCard } from "@/components/output/PackageArtifactCard";
import { PackageChecklist } from "@/components/output/PackageChecklist";
import { SubmissionPackageBlockers } from "@/components/output/SubmissionPackageBlockers";
import { SubmissionPackageSummary } from "@/components/output/SubmissionPackageSummary";
import { SubmissionValidationStrip } from "@/components/output/SubmissionValidationStrip";
import { Card } from "@/components/ui/Card";
import { useControl } from "@/context/useControl";
import { useOutput } from "@/context/useOutput";
import {
  buildSubmissionPackageBlockers,
  buildSubmissionPackageChecklistRows,
  bundleArtifactIds,
  computeSubmissionAssemblyAssessment,
  computeSubmissionPackageSummaryStats,
  copyTextToClipboard,
  formatSubmissionPackageReadinessExport,
} from "@/lib/output-utils";

export function SubmissionPackagePage() {
  const { submissionItems } = useControl();
  const {
    project,
    artifacts,
    copyChecklistSummary,
    copyReadinessSummary,
    copySectionPlainText,
    bundles,
    copyBundleJson,
    redactionSummary,
  } = useOutput();

  const subBundle = bundles.find((b) => b.bundleType === "Submission Package");
  const subIds = new Set(bundleArtifactIds("Submission Package", artifacts));
  const packageArtifacts = artifacts.filter((a) => subIds.has(a.id));

  const checklistRows = useMemo(
    () => buildSubmissionPackageChecklistRows(artifacts, submissionItems),
    [artifacts, submissionItems],
  );

  const stats = useMemo(
    () => computeSubmissionPackageSummaryStats(checklistRows),
    [checklistRows],
  );

  const redactedRow = useMemo(
    () => checklistRows.find((r) => r.specId === "redacted-copy"),
    [checklistRows],
  );

  const assessment = useMemo(
    () =>
      computeSubmissionAssemblyAssessment({
        stats,
        redactionUnresolved: redactionSummary.unresolvedCount,
        redactedChecklistRow: redactedRow,
      }),
    [stats, redactionSummary.unresolvedCount, redactedRow],
  );

  const blockers = useMemo(
    () =>
      buildSubmissionPackageBlockers({
        rows: checklistRows,
        redactionUnresolved: redactionSummary.unresolvedCount,
      }),
    [checklistRows, redactionSummary.unresolvedCount],
  );

  const copyPackageReadiness = () =>
    copyTextToClipboard(
      formatSubmissionPackageReadinessExport(
        project,
        stats,
        assessment,
        checklistRows,
      ),
    );

  return (
    <div className="px-4 py-6 sm:p-8">
      <div className="mx-auto w-full max-w-6xl space-y-8">
        <OutputSubNav />

        <header className="space-y-2 border-b border-border pb-6">
          <h1 className="text-2xl font-semibold tracking-tight text-ink">
            Submission package
          </h1>
          <p className="max-w-3xl text-sm leading-relaxed text-ink-muted">
            Production checklist for <span className="font-medium text-ink">{project.bidNumber}</span>
            : proposal forms, scored volumes, compliance artifacts, pricing, and
            redacted disclosure — staged for manual submission assembly. Status flows from{" "}
            <span className="font-medium text-ink">Bid control</span> and{" "}
            <span className="font-medium text-ink">drafting</span>; this page is the
            last structured view before handoff.
          </p>
        </header>

        <SubmissionPackageSummary
          bidNumber={project.bidNumber}
          stats={stats}
          assessment={assessment}
        />

        <SubmissionValidationStrip current={assessment.state} />

        <PackageChecklist rows={checklistRows} />

        <section className="space-y-3">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-ink-subtle">
            Source artifacts in this submission package
          </h2>
          <p className="max-w-3xl text-xs leading-relaxed text-ink-muted">
            Operational detail for every object included in packaging. Use{" "}
            <span className="font-medium text-ink">Open source artifact</span> to
            edit upstream; <span className="font-medium text-ink">Copy clean text</span>{" "}
            applies to draft bodies only.
          </p>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {packageArtifacts.map((a) => (
              <PackageArtifactCard
                key={a.id}
                artifact={a}
                onCopyPlainText={
                  a.artifactType === "Draft Section"
                    ? () => copySectionPlainText(a.sourceEntityId)
                    : undefined
                }
              />
            ))}
          </div>
        </section>

        <SubmissionPackageBlockers blockers={blockers} />

        <div className="space-y-2">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-ink-subtle">
            Export
          </h2>
          <ExportActionBar
            actions={[
              {
                label: "Copy submission checklist (Markdown)",
                onClick: copyChecklistSummary,
              },
              {
                label: "Copy readiness summary (text)",
                onClick: copyReadinessSummary,
              },
              {
                label: "Copy submission package readiness (Markdown)",
                onClick: copyPackageReadiness,
              },
              ...(subBundle
                ? [
                    {
                      label: "Copy submission package bundle (JSON)",
                      onClick: () => copyBundleJson(subBundle.id),
                    },
                  ]
                : []),
            ]}
          />
        </div>

        <Card className="p-4">
          <h2 className="text-sm font-semibold text-ink">
            Narrative volumes — quick copy
          </h2>
          <p className="mt-2 text-xs text-ink-muted">
            Copies active draft body only (no metadata wrapper). Use for paste into
            the submission portal or offline assembly.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {(["Experience", "Solution", "Risk"] as const).map((label) => {
              const art = packageArtifacts.find(
                (a) => a.artifactType === "Draft Section" && a.notes === label,
              );
              if (!art) return null;
              return (
                <button
                  key={label}
                  type="button"
                  className="rounded-md border border-border bg-surface-raised px-3 py-1.5 text-xs font-medium text-ink hover:bg-zinc-50"
                  onClick={() => void copySectionPlainText(art.sourceEntityId)}
                >
                  Copy {label}
                </button>
              );
            })}
          </div>
        </Card>
      </div>
    </div>
  );
}
