import { useMemo, useCallback } from "react";
import { ExportActionBar } from "@/components/output/ExportActionBar";
import { FinalReadinessGateCard } from "@/components/output/FinalReadinessGateCard";
import { ArbuySolicitationStatus } from "@/components/output/ArbuySolicitationStatus";
import { TechnicalProposalPacketStatus } from "@/components/output/TechnicalProposalPacketStatus";
import { OutputSubNav } from "@/components/output/OutputSubNav";
import { PackageArtifactCard } from "@/components/output/PackageArtifactCard";
import { PackageChecklist } from "@/components/output/PackageChecklist";
import { SubmissionPackageBlockers } from "@/components/output/SubmissionPackageBlockers";
import { SubmissionPackageSummary } from "@/components/output/SubmissionPackageSummary";
import { SubmissionValidationStrip } from "@/components/output/SubmissionValidationStrip";
import { Card } from "@/components/ui/Card";
import { useControl } from "@/context/useControl";
import { useOutput } from "@/context/useOutput";
import { useWorkspace } from "@/context/useWorkspace";
import { formatPricingFullNarrativeExportAppendix } from "@/data/pricing-proposal-language-mapping";
import {
  buildPricingLayerForProject,
  formatPricingNumericSummaryExport,
  formatPricingSummaryExport,
} from "@/lib/pricing-structure";
import { computeWorkbookPricingPreview } from "@/lib/pricing-reality-preview";
import { formatVendorDecisionSynthesisExport } from "@/lib/decision-synthesis-engine";
import { DecisionSummaryCard } from "@/components/output/DecisionSummaryCard";
import { PricingRiskSummaryCard } from "@/components/output/PricingRiskSummaryCard";
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
  const { files } = useWorkspace();
  const {
    project,
    artifacts,
    copyChecklistSummary,
    copyReadinessSummary,
    copySectionPlainText,
    bundles,
    copyBundleJson,
    redactionSummary,
    finalReadinessGate,
    technicalProposalPacketCompliance,
    arbuySolicitationCompliance,
    competitorAwareSimulation,
    vendorDecisionSynthesis,
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

  const pricingLayer = useMemo(
    () => buildPricingLayerForProject(project.bidNumber, files),
    [project.bidNumber, files],
  );

  const workbookPricingPreview = useMemo(
    () => computeWorkbookPricingPreview(pricingLayer, project.bidNumber),
    [pricingLayer, project.bidNumber],
  );

  const vendorNameById = useMemo(() => {
    const m: Record<string, string> = {};
    for (const e of competitorAwareSimulation?.entries ?? []) {
      m[e.vendorId] = e.vendorName;
    }
    return m;
  }, [competitorAwareSimulation]);

  const copyDecisionSynthesis = useCallback(() => {
    if (!vendorDecisionSynthesis) return copyTextToClipboard("");
    return copyTextToClipboard(formatVendorDecisionSynthesisExport(vendorDecisionSynthesis));
  }, [vendorDecisionSynthesis]);

  const copyPricingSummary = () =>
    copyTextToClipboard(formatPricingSummaryExport(pricingLayer));

  const copyFullPricingNarrative = () =>
    copyTextToClipboard(
      formatPricingNumericSummaryExport(pricingLayer) +
        formatPricingFullNarrativeExportAppendix(),
    );

  const priceArtifact = artifacts.find((a) => a.artifactType === "Price Sheet Support");

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

        <FinalReadinessGateCard gate={finalReadinessGate} />

        <DecisionSummaryCard
          synthesis={vendorDecisionSynthesis}
          vendorNameById={vendorNameById}
        />

        <TechnicalProposalPacketStatus compliance={technicalProposalPacketCompliance} />

        <ArbuySolicitationStatus compliance={arbuySolicitationCompliance} />

        <SubmissionPackageSummary
          bidNumber={project.bidNumber}
          stats={stats}
          assessment={assessment}
        />

        <Card className="space-y-3 border-zinc-200/90 p-4">
          <h2 className="text-sm font-semibold text-ink">Pricing summary (structured)</h2>
          <p className="text-xs leading-relaxed text-ink-muted">
            Generated from uploaded pricing files (JSON in file description) or the canonical scaffold
            for this bid. Include the official price sheet file in the package; this block is the
            structured rollup for assembly and totals cross-check.
          </p>
          <div className="flex flex-wrap items-center gap-3 text-xs text-ink-muted">
            <span>
              Annual <span className="font-semibold tabular-nums text-ink">${pricingLayer.model.totals.annual.toLocaleString()}</span>
            </span>
            <span className="text-ink-subtle">·</span>
            <span>
              Contract{" "}
              <span className="font-semibold tabular-nums text-ink">
                ${pricingLayer.model.totals.contractTotal.toLocaleString()}
              </span>
            </span>
            <span className="text-ink-subtle">·</span>
            <span className={pricingLayer.ready ? "text-emerald-900" : "text-amber-900"}>
              {pricingLayer.ready ? "Aligned & ready" : "Not ready — review dashboard pricing status"}
            </span>
          </div>
          {priceArtifact ? (
            <p className="text-[11px] text-ink-muted">
              Price sheet artifact:{" "}
              <span className="font-medium text-ink">{priceArtifact.title}</span> ({priceArtifact.status})
            </p>
          ) : (
            <p className="text-[11px] text-amber-900">
              Link a <span className="font-medium">Price Sheet Support</span> artifact in Bid control so
              the submission package lists the official workbook.
            </p>
          )}
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              className="rounded-md border border-border bg-surface-raised px-3 py-1.5 text-xs font-medium text-ink hover:bg-zinc-50"
              onClick={() => void copyPricingSummary()}
            >
              Copy pricing summary (text)
            </button>
            <button
              type="button"
              className="rounded-md border border-border bg-white px-3 py-1.5 text-xs font-medium text-ink-muted hover:bg-zinc-50"
              onClick={() => void copyFullPricingNarrative()}
            >
              Copy summary + full narrative mapping
            </button>
          </div>
        </Card>

        <PricingRiskSummaryCard preview={workbookPricingPreview} />

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
                label: "Copy decision synthesis (Markdown)",
                onClick: copyDecisionSynthesis,
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
            {(
              [
                "Experience",
                "Solution",
                "Risk",
                "Interview",
                "Executive Summary",
              ] as const
            ).map((label) => {
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
