import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { VendorComparisonTable } from "@/components/vendors/VendorComparisonTable";
import { VendorGapHeatmap } from "@/components/vendors/VendorGapHeatmap";
import { VendorPointLossCard } from "@/components/vendors/VendorPointLossCard";
import { VendorRecommendationCard } from "@/components/vendors/VendorRecommendationCard";
import { VendorScenarioSwitcher } from "@/components/vendors/VendorScenarioSwitcher";
import { useArchitecture } from "@/context/useArchitecture";
import { useProjectWorkspace } from "@/context/project-workspace-context";
import { useVendors } from "@/context/useVendors";
import { postCompetitorSimulation } from "@/lib/functions-api";
import { vendorsByIds } from "@/lib/vendor-utils";
import type { CompetitorAwareSimulationResult } from "@/types";

export function VendorComparePage() {
  const { vendors, compareVendorIds, clearCompareSelection } = useVendors();
  const { options } = useArchitecture();
  const { projectId, loading: wsLoading, error: wsError } = useProjectWorkspace();
  const selected = vendorsByIds(vendors, compareVendorIds);

  const [archScenario, setArchScenario] = useState<string | null>(null);
  const [sim, setSim] = useState<CompetitorAwareSimulationResult | null>(null);
  const [simError, setSimError] = useState<string | null>(null);
  const [simLoading, setSimLoading] = useState(false);

  const vendorNameMap = useMemo(
    () => Object.fromEntries(vendors.map((v) => [v.id, v.name])),
    [vendors],
  );

  const runSim = useCallback(async () => {
    if (!projectId || selected.length < 2) {
      setSim(null);
      setSimError(null);
      setSimLoading(false);
      return;
    }
    setSimLoading(true);
    setSimError(null);
    try {
      const r = await postCompetitorSimulation({
        projectId,
        comparedVendorIds: selected.map((v) => v.id),
        architectureOptionId: archScenario,
      });
      setSim(r);
    } catch (e) {
      setSimError(e instanceof Error ? e.message : "Simulation failed");
      setSim(null);
    } finally {
      setSimLoading(false);
    }
  }, [projectId, selected, archScenario]);

  useEffect(() => {
    void runSim();
  }, [runSim]);

  return (
    <div className="p-8">
      <div className="mx-auto max-w-[1400px] space-y-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-ink">
              Vendor comparison
            </h1>
            <p className="mt-1 max-w-3xl text-sm text-ink-muted">
              Evidence-backed comparison for this solicitation: bid competitiveness,
              integration burden, evaluator-style impacts, and honest confidence — not
              generic vendor quality.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link to="/vendors">
              <Button type="button" variant="secondary">
                Directory
              </Button>
            </Link>
            <Button type="button" variant="secondary" onClick={clearCompareSelection}>
              Clear selection
            </Button>
            <Button
              type="button"
              variant="secondary"
              disabled={!projectId || selected.length < 2 || simLoading}
              onClick={() => void runSim()}
            >
              {simLoading ? "Refreshing…" : "Refresh analysis"}
            </Button>
          </div>
        </div>

        {wsError ? (
          <p className="text-sm text-amber-800">{wsError}</p>
        ) : null}
        {wsLoading ? <p className="text-xs text-ink-muted">Loading workspace…</p> : null}

        {selected.length < 2 ? (
          <div className="rounded-lg border border-dashed border-border bg-zinc-50/50 px-6 py-10 text-center">
            <p className="text-sm font-medium text-ink">
              Select at least two vendors to compare
            </p>
            <p className="mt-1 text-sm text-ink-muted">
              Use checkboxes on the vendor directory, then return here.
            </p>
            <Link to="/vendors" className="mt-4 inline-block">
              <Button type="button">Go to directory</Button>
            </Link>
          </div>
        ) : (
          <>
            <VendorScenarioSwitcher
              options={options}
              architectureOptionId={archScenario}
              onArchitectureOptionChange={setArchScenario}
            />

            <VendorComparisonTable vendors={selected} />

            {simError ? (
              <p className="text-sm text-ink-muted">{simError}</p>
            ) : null}

            {sim && sim.entries.length > 0 ? (
              <>
                <VendorRecommendationCard
                  recommendedVendorName={
                    sim.recommendedVendorId
                      ? vendorNameMap[sim.recommendedVendorId]
                      : undefined
                  }
                  recommendationConfidence={sim.recommendationConfidence}
                  recommendedRationale={sim.recommendedRationale}
                  decisionRisks={sim.decisionRisks}
                  scenarioNotes={sim.scenarioNotes}
                />

                <VendorPointLossCard
                  pointLossComparisons={sim.pointLossComparisons}
                  honestyNote={sim.honestyNote}
                />

                <Card className="space-y-3 p-4">
                  <h2 className="text-sm font-semibold text-ink">
                    Bid competitiveness (interpretive)
                  </h2>
                  <p className="text-xs text-ink-muted">
                    Composite 0–100 for this solicitation; directional evaluator impacts
                    are ± rough points on a 0–100 interpretive scale.
                  </p>
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse text-left text-xs">
                      <thead>
                        <tr className="border-b border-border bg-zinc-50/80">
                          <th className="px-2 py-2">Vendor</th>
                          <th className="px-2 py-2">Overall</th>
                          <th className="px-2 py-2">Conf.</th>
                          <th className="px-2 py-2">Exp Δ</th>
                          <th className="px-2 py-2">Sol Δ</th>
                          <th className="px-2 py-2">Risk Δ</th>
                          <th className="px-2 py-2">Intvw Δ</th>
                        </tr>
                      </thead>
                      <tbody>
                        {sim.entries.map((e) => (
                          <tr key={e.vendorId} className="border-b border-border">
                            <td className="px-2 py-2 font-medium text-ink">
                              {e.vendorName}
                            </td>
                            <td className="px-2 py-2">{e.overallScore}</td>
                            <td className="px-2 py-2">{e.confidence}</td>
                            <td className="px-2 py-2">
                              {e.evaluatorBidScoreImpact.experienceImpact}
                            </td>
                            <td className="px-2 py-2">
                              {e.evaluatorBidScoreImpact.solutionImpact}
                            </td>
                            <td className="px-2 py-2">
                              {e.evaluatorBidScoreImpact.riskImpact}
                            </td>
                            <td className="px-2 py-2">
                              {e.evaluatorBidScoreImpact.interviewImpact}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </Card>

                <div>
                  <h2 className="mb-2 text-sm font-semibold text-ink">
                    Gap heatmap / fit matrix
                  </h2>
                  <VendorGapHeatmap
                    matrix={sim.heatmapMatrix}
                    vendorNames={vendorNameMap}
                  />
                </div>

                <Card className="space-y-2 p-4">
                  <h2 className="text-sm font-semibold text-ink">
                    Competitor-aware interview questions
                  </h2>
                  <ul className="list-inside list-disc space-y-1 text-sm text-ink-muted">
                    {sim.competitorInterviewQuestions.map((q, i) => (
                      <li key={i}>{q}</li>
                    ))}
                  </ul>
                </Card>

                <div className="grid gap-4 md:grid-cols-2">
                  {sim.entries.map((e) => (
                    <Card key={e.vendorId} className="space-y-2 p-4">
                      <h3 className="text-sm font-semibold text-ink">{e.vendorName}</h3>
                      {e.pricingReality ? (
                        <div className="rounded-md border border-dashed border-emerald-200/60 bg-emerald-50/40 p-2 text-[11px] text-ink-muted">
                          <p className="font-medium text-ink">
                            Pricing reality: {e.pricingReality.completeness} · hidden-cost{" "}
                            {e.pricingReality.hiddenCostRisk} · Malone unpriced{" "}
                            {e.pricingReality.maloneUnpricedDependency}
                          </p>
                        </div>
                      ) : null}
                      {e.roleFitSummary ? (
                        <div className="rounded-md border border-dashed border-slate-200 bg-slate-50/50 p-2 text-[11px] text-ink-muted">
                          <p className="font-medium text-ink">
                            Role fit:{" "}
                            <span className="capitalize">
                              {e.roleFitSummary.roleStrategyAssessment.replace(/_/g, " ")}
                            </span>
                          </p>
                          <p className="mt-1">
                            Strong own {e.roleFitSummary.strongOwnRoles.length} · Avoid{" "}
                            {e.roleFitSummary.avoidRoles.length} · High Malone-dep roles{" "}
                            {e.roleFitSummary.highestDependencyRoles.length}
                          </p>
                        </div>
                      ) : null}
                      {e.failureResilienceSummary ? (
                        <div className="rounded-md border border-dashed border-border bg-zinc-50/60 p-2 text-[11px] text-ink-muted">
                          <p className="font-medium text-ink">
                            Failure posture:{" "}
                            <span className="capitalize">
                              {e.failureResilienceSummary.overallResilience.replace(
                                /_/g,
                                " ",
                              )}
                            </span>
                          </p>
                          <p className="mt-1">
                            Critical-impact scenarios:{" "}
                            {e.failureResilienceSummary.criticalScenarioCount} ·
                            High-likelihood: {e.failureResilienceSummary.highLikelihoodCount}{" "}
                            · Weak/unknown prep:{" "}
                            {e.failureResilienceSummary.lowPreparednessCount}
                          </p>
                          {e.failureResilienceSummary.decisionWarnings.length > 0 ? (
                            <ul className="mt-1 list-inside list-disc text-[10px] text-amber-950/90">
                              {e.failureResilienceSummary.decisionWarnings
                                .slice(0, 2)
                                .map((w, i) => (
                                  <li key={i}>{w}</li>
                                ))}
                            </ul>
                          ) : null}
                        </div>
                      ) : null}
                      <p className="text-[10px] font-medium uppercase text-ink-subtle">
                        Advantages
                      </p>
                      <ul className="list-inside list-disc text-xs text-ink-muted">
                        {e.topAdvantages.map((x, i) => (
                          <li key={i}>{x}</li>
                        ))}
                      </ul>
                      <p className="text-[10px] font-medium uppercase text-ink-subtle">
                        Disadvantages
                      </p>
                      <ul className="list-inside list-disc text-xs text-ink-muted">
                        {e.topDisadvantages.map((x, i) => (
                          <li key={i}>{x}</li>
                        ))}
                      </ul>
                    </Card>
                  ))}
                </div>
              </>
            ) : sim && sim.entries.length === 0 ? (
              <p className="text-sm text-ink-muted">{sim.honestyNote}</p>
            ) : null}
          </>
        )}
      </div>
    </div>
  );
}
