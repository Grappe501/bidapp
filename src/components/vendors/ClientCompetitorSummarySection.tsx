import { useEffect, useState } from "react";
import { Card } from "@/components/ui/Card";
import { VendorRecommendationCard } from "@/components/vendors/VendorRecommendationCard";
import { useProjectWorkspace } from "@/context/project-workspace-context";
import { useVendors } from "@/context/useVendors";
import { postCompetitorSimulation } from "@/lib/functions-api";
import type { CompetitorAwareSimulationResult } from "@/types";

/**
 * Client review: short competitor-aware recommendation using all workspace vendors (capped by API).
 */
export function ClientCompetitorSummarySection() {
  const { projectId, loading, error } = useProjectWorkspace();
  const { vendors } = useVendors();
  const [sim, setSim] = useState<CompetitorAwareSimulationResult | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (!projectId || loading || error || vendors.length < 2) {
      setSim(null);
      return;
    }
    let cancelled = false;
    void (async () => {
      try {
        const r = await postCompetitorSimulation({
          projectId,
          comparedVendorIds: vendors.slice(0, 10).map((v) => v.id),
          architectureOptionId: null,
        });
        if (!cancelled) {
          setSim(r);
          setErr(null);
        }
      } catch (e) {
        if (!cancelled) {
          setErr(e instanceof Error ? e.message : "Could not load");
          setSim(null);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [projectId, loading, error, vendors]);

  if (loading || !projectId) return null;
  if (error || err) return null;
  if (vendors.length < 2) return null;
  if (!sim || sim.entries.length === 0) return null;

  const lead = sim.entries.sort((a, b) => b.overallScore - a.overallScore)[0];

  return (
    <Card className="border-slate-200/90 bg-white p-4">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-ink-subtle">
        Competitor-aware vendor posture
      </p>
      <p className="mt-1 text-xs text-ink-muted">
        Compared {sim.entries.length} vendors for this bid — same logic as the vendor
        comparison workspace.
      </p>
      <div className="mt-4">
        <VendorRecommendationCard
          recommendedVendorName={lead?.vendorName}
          recommendationConfidence={sim.recommendationConfidence}
          recommendedRationale={sim.recommendedRationale}
          decisionRisks={sim.decisionRisks}
          scenarioNotes={sim.scenarioNotes}
        />
      </div>
    </Card>
  );
}
