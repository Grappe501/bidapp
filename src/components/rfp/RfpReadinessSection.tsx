import { useMemo } from "react";
import { Card } from "@/components/ui/Card";
import { RfpHealthStatus } from "@/components/rfp/RfpHealthStatus";
import { buildProjectGroundingBundleRfp } from "@/lib/rfp-narrative";
import {
  computeRfpHealth,
  pickStructuredRfp,
  validateRfpFileCoverage,
} from "@/lib/rfp-document-validation";
import type { FileRecord, Project } from "@/types";

type RfpReadinessSectionProps = {
  project: Project;
  files: FileRecord[];
};

export function RfpReadinessSection({ project, files }: RfpReadinessSectionProps) {
  const { structured, coverage, health } = useMemo(() => {
    const layer = buildProjectGroundingBundleRfp({
      bidNumber: project.bidNumber,
      title: project.title,
      issuingOrganization: project.issuingOrganization,
      dueDate: project.dueDate,
    });
    const structuredInner = pickStructuredRfp(layer);
    const coverageInner = validateRfpFileCoverage(structuredInner, files);
    const healthInner = computeRfpHealth(structuredInner, coverageInner, files);
    return {
      structured: structuredInner,
      coverage: coverageInner,
      health: healthInner,
    };
  }, [project, files]);

  const notReady =
    coverage.missingDocuments.length > 0 ||
    coverage.unstructuredDocuments.length > 0;

  return (
    <Card className="space-y-4 border border-emerald-900/10 bg-gradient-to-br from-emerald-50/50 to-white p-5 shadow-sm">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-sm font-semibold text-ink">RFP readiness</h2>
          <p className="mt-1 max-w-2xl text-xs leading-relaxed text-ink-muted">
            Solicitation{" "}
            <span className="font-mono font-medium text-ink">
              {structured.core.solicitationNumber}
            </span>
            {" · "}
            Due {structured.core.dueDate || project.dueDate || "—"} · Submission via{" "}
            {structured.core.submissionMethod || "—"}
          </p>
        </div>
        <div className="shrink-0 rounded border border-zinc-200/80 bg-white px-2.5 py-1 text-[10px] font-medium uppercase tracking-wide text-ink-muted">
          {notReady ? "Not ready" : "On track"}
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <RfpHealthStatus health={health} />
        <div className="space-y-2 text-xs">
          <p className="font-medium text-ink">Required submission documents</p>
          {coverage.missingDocuments.length > 0 ? (
            <ul className="list-inside list-disc text-amber-950/90">
              {coverage.missingDocuments.map((m) => (
                <li key={m}>Missing: {m}</li>
              ))}
            </ul>
          ) : (
            <p className="text-emerald-900/90">All required types matched to uploads.</p>
          )}
          {coverage.unstructuredDocuments.length > 0 ? (
            <ul className="list-inside list-disc text-amber-900/90">
              {coverage.unstructuredDocuments.map((u) => (
                <li key={u}>{u}</li>
              ))}
            </ul>
          ) : null}
          {coverage.parsedDocuments.length > 0 ? (
            <details className="rounded border border-zinc-200/80 bg-zinc-50/50 p-2">
              <summary className="cursor-pointer text-[10px] font-medium text-ink-muted">
                Parsed / mapped ({coverage.parsedDocuments.length})
              </summary>
              <ul className="mt-1 list-inside list-disc text-ink-muted">
                {coverage.parsedDocuments.slice(0, 8).map((p) => (
                  <li key={p}>{p}</li>
                ))}
              </ul>
            </details>
          ) : null}
        </div>
      </div>

      <p className="text-[10px] leading-relaxed text-ink-subtle">
        Evaluation model: Experience {structured.evaluation.experienceWeight}% · Solution{" "}
        {structured.evaluation.solutionWeight}% · Risk {structured.evaluation.riskWeight}% ·
        Interview {structured.evaluation.interviewWeight}% (total{" "}
        {structured.evaluation.totalScore || "—"}).
      </p>
    </Card>
  );
}
