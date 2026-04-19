import { useEffect, useState } from "react";
import { Card } from "@/components/ui/Card";
import { postVendorIntelligenceExport } from "@/lib/functions-api";
import { useProjectWorkspace } from "@/context/project-workspace-context";
import type { GroundingBundleVendorIntelligence } from "@/types";

/**
 * Client review: top vendor strengths, risks, and confidence from stored intelligence.
 */
export function ClientVendorIntelligenceSection() {
  const { projectId, loading, error } = useProjectWorkspace();
  const [data, setData] = useState<{
    vendors: GroundingBundleVendorIntelligence[];
    vendorComparisonNote: string | null;
  } | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    if (!projectId || loading || error) return;
    let cancelled = false;
    void (async () => {
      try {
        const r = await postVendorIntelligenceExport(projectId);
        if (!cancelled) {
          setData(r);
          setLoadError(null);
        }
      } catch (e) {
        if (!cancelled) {
          setLoadError(e instanceof Error ? e.message : "Could not load");
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [projectId, loading, error]);

  if (loading || !projectId) {
    return null;
  }
  if (error || loadError) {
    return (
      <Card className="border-amber-200/80 bg-amber-50/50 p-4">
        <p className="text-[10px] font-semibold uppercase tracking-wide text-amber-900/80">
          Vendor intelligence
        </p>
        <p className="mt-1 text-sm text-amber-950/90">
          {loadError ?? error ?? "Workspace unavailable."}
        </p>
      </Card>
    );
  }

  if (!data || data.vendors.length === 0) {
    return (
      <Card className="p-4">
        <p className="text-[10px] font-semibold uppercase tracking-wide text-ink-subtle">
          Vendor intelligence
        </p>
        <p className="mt-2 text-sm text-ink-muted">
          No vendor intelligence rows yet — run research and compute fit from a vendor
          dossier when the API is available.
        </p>
      </Card>
    );
  }

  return (
    <Card className="space-y-4 p-4">
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-wide text-ink-subtle">
          Vendor intelligence
        </p>
        <p className="mt-1 text-sm text-ink-muted">
          Strengths, risks, and confidence bands from stored fit dimensions and claims
          (not generated marketing copy).
        </p>
      </div>
      {data.vendorComparisonNote ? (
        <p className="text-xs text-ink-muted">{data.vendorComparisonNote}</p>
      ) : null}
      <ul className="space-y-4">
        {data.vendors.map((v) => (
          <li
            key={v.vendorId}
            className="rounded-lg border border-border bg-slate-50/60 p-3"
          >
            <p className="font-medium text-ink">{v.vendorName}</p>
            <div className="mt-2 grid gap-3 sm:grid-cols-3">
              <div>
                <p className="text-[10px] font-medium uppercase text-ink-subtle">
                  Strengths (fit ≥4)
                </p>
                <ul className="mt-1 list-inside list-disc text-xs text-ink-muted">
                  {v.fitDimensions
                    .filter((d) => d.score >= 4)
                    .slice(0, 4)
                    .map((d) => (
                      <li key={d.dimensionKey}>
                        {d.dimensionKey}: score {d.score} ({d.confidence || "—"})
                      </li>
                    ))}
                  {v.fitDimensions.filter((d) => d.score >= 4).length === 0 ? (
                    <li>None in top band yet</li>
                  ) : null}
                </ul>
              </div>
              <div>
                <p className="text-[10px] font-medium uppercase text-ink-subtle">
                  Risks & gaps
                </p>
                <ul className="mt-1 list-inside list-disc text-xs text-ink-muted">
                  {v.fitDimensions
                    .filter((d) => d.score <= 2)
                    .slice(0, 4)
                    .map((d) => (
                      <li key={d.dimensionKey}>{d.rationale.slice(0, 140)}</li>
                    ))}
                  {v.integrationRequirements
                    .filter((r) => r.status === "unknown" || r.status === "gap")
                    .slice(0, 3)
                    .map((r) => (
                      <li key={r.requirementKey}>
                        Integration {r.requirementKey}: {r.status}
                      </li>
                    ))}
                </ul>
              </div>
              <div>
                <p className="text-[10px] font-medium uppercase text-ink-subtle">
                  Evidence density
                </p>
                <p className="mt-1 text-xs text-ink-muted">
                  Claims: {v.vendorClaims.length} · Facts: {v.intelligenceFacts.length}{" "}
                  · Interview Qs: {v.interviewQuestions.length}
                </p>
              </div>
            </div>
            {v.pricingReality ? (
              <div className="mt-3 rounded-md border border-dashed border-border bg-white/80 p-2">
                <p className="text-[10px] font-medium uppercase text-ink-subtle">
                  Pricing reality
                </p>
                <p className="mt-1 text-xs text-ink-muted">
                  Workbook vs role:{" "}
                  <span className="font-medium capitalize text-ink">
                    {v.pricingReality.completeness}
                  </span>{" "}
                  completeness,{" "}
                  <span className="font-medium capitalize text-ink">
                    {v.pricingReality.roleAlignment}
                  </span>{" "}
                  alignment — hidden-cost {v.pricingReality.hiddenCostRisk}, Malone unpriced{" "}
                  {v.pricingReality.maloneUnpricedDependency}. Avoid low-price bragging without scope
                  proof.
                </p>
              </div>
            ) : null}
            {v.roleFit ? (
              <div className="mt-3 rounded-md border border-dashed border-slate-200 bg-slate-50/60 p-2">
                <p className="text-[10px] font-medium uppercase text-ink-subtle">
                  Role fit (vendor vs Malone)
                </p>
                <p className="mt-1 text-xs text-ink-muted">
                  Strategy:{" "}
                  <span className="font-medium capitalize text-ink">
                    {v.roleFit.summary.roleStrategyAssessment.replace(/_/g, " ")}
                  </span>
                  {" — "}
                  {v.roleFit.summary.strongOwnRoles.length} strong own role(s);{" "}
                  {v.roleFit.summary.avoidRoles.length} avoid;{" "}
                  {v.roleFit.summary.highestDependencyRoles.length} high Malone-dependency role(s).
                  Name RACI in Solution/Risk — do not imply seamless vendor-only coverage.
                </p>
              </div>
            ) : null}
            {v.failureSimulation ? (
              <div className="mt-3 rounded-md border border-dashed border-border bg-white/80 p-2">
                <p className="text-[10px] font-medium uppercase text-ink-subtle">
                  Failure simulation (heuristic)
                </p>
                <p className="mt-1 text-xs text-ink-muted">
                  Resilience:{" "}
                  <span className="font-medium capitalize text-ink">
                    {v.failureSimulation.summary.overallResilience.replace(/_/g, " ")}
                  </span>
                  {" — "}
                  {v.failureSimulation.summary.scenarioCount} scenarios modeled; critical-impact{" "}
                  {v.failureSimulation.summary.criticalScenarioCount}. Ground Risk / Solution
                  drafting on top modes and Malone dependency, not on vendor marketing alone.
                </p>
                {v.failureSimulation.summary.decisionWarnings.length > 0 ? (
                  <ul className="mt-1 list-inside list-disc text-[11px] text-amber-950/90">
                    {v.failureSimulation.summary.decisionWarnings.slice(0, 3).map((w, i) => (
                      <li key={i}>{w}</li>
                    ))}
                  </ul>
                ) : null}
              </div>
            ) : null}
          </li>
        ))}
      </ul>
    </Card>
  );
}
