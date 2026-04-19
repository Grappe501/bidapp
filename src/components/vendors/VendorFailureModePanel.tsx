import { useCallback, useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Select } from "@/components/ui/Select";
import { postVendorIntelligence } from "@/lib/functions-api";
import type { VendorFailureModeRecord, VendorFailureSimulationSummary } from "@/types";

type StressFamily =
  | "all"
  | "delivery"
  | "integration"
  | "implementation"
  | "compliance"
  | "commercial"
  | "dependency";

const STRESS_TABS: { id: StressFamily; label: string }[] = [
  { id: "all", label: "All" },
  { id: "delivery", label: "Delivery & support" },
  { id: "integration", label: "Integration" },
  { id: "implementation", label: "Implementation & staffing" },
  { id: "compliance", label: "Compliance & security" },
  { id: "commercial", label: "Commercial & billing" },
  { id: "dependency", label: "Malone / stack" },
];

function matchesStressFamily(
  family: StressFamily,
  category: VendorFailureModeRecord["category"],
): boolean {
  if (family === "all") return true;
  if (family === "delivery")
    return category === "delivery" || category === "support";
  if (family === "integration") return category === "integration";
  if (family === "implementation")
    return category === "implementation" || category === "staffing";
  if (family === "compliance")
    return (
      category === "compliance" ||
      category === "security" ||
      category === "data"
    );
  if (family === "commercial")
    return category === "commercial" || category === "billing";
  if (family === "dependency") return category === "dependency";
  return true;
}

function resilienceLabel(
  r: VendorFailureSimulationSummary["overallResilience"],
): string {
  switch (r) {
    case "strong":
      return "Strong";
    case "acceptable":
      return "Acceptable";
    case "fragile":
      return "Fragile";
    case "high_risk":
      return "High risk";
    default:
      return r;
  }
}

export function VendorFailureModePanel(props: {
  projectId: string;
  vendorId: string;
  architectureOptions: { id: string; name: string }[];
  onAfterRun?: () => void;
}) {
  const { projectId, vendorId, architectureOptions, onAfterRun } = props;
  const [stress, setStress] = useState<StressFamily>("all");
  const [archId, setArchId] = useState<string>("");
  const [summary, setSummary] = useState<VendorFailureSimulationSummary | null>(
    null,
  );
  const [modes, setModes] = useState<VendorFailureModeRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setErr(null);
    try {
      const res = (await postVendorIntelligence({
        projectId,
        vendorId,
        action: "listFailureModes",
      })) as {
        summary: VendorFailureSimulationSummary | null;
        modes: VendorFailureModeRecord[];
      };
      setSummary(res.summary);
      setModes(res.modes);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Failed to load failure modes");
      setSummary(null);
      setModes([]);
    } finally {
      setLoading(false);
    }
  }, [projectId, vendorId]);

  useEffect(() => {
    void load();
  }, [load]);

  const filtered = useMemo(
    () => modes.filter((m) => matchesStressFamily(stress, m.category)),
    [modes, stress],
  );

  const runSimulation = async () => {
    setBusy("Running simulation…");
    setErr(null);
    try {
      const arch =
        archId.trim() === "" ? undefined : archId.trim();
      const res = (await postVendorIntelligence({
        projectId,
        vendorId,
        action: "runFailureSimulation",
        architectureOptionId: arch,
      })) as { summary: VendorFailureSimulationSummary };
      setSummary(res.summary);
      await load();
      onAfterRun?.();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Simulation failed");
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="space-y-4">
      <Card className="space-y-3 p-4">
        <div>
          <h2 className="text-sm font-semibold text-ink">Failure mode simulation</h2>
          <p className="mt-1 text-xs text-ink-muted">
            Heuristic stress scenarios for this solicitation (S479 / Malone context). Likelihood
            and impact are evidence-conditioned — not forecasts. Sparse evidence stays visible as
            unknowns.
          </p>
        </div>

        <div className="flex flex-wrap items-end gap-3">
          <label className="block min-w-[200px] space-y-1">
            <span className="text-[10px] font-medium uppercase text-ink-subtle">
              Architecture context (optional)
            </span>
            <Select
              value={archId}
              onChange={(e) => setArchId(e.target.value)}
              className="text-sm"
            >
              <option value="">None / generic</option>
              {architectureOptions.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.name || o.id.slice(0, 8)}
                </option>
              ))}
            </Select>
          </label>
          <Button
            type="button"
            disabled={!!busy || loading}
            onClick={() => void runSimulation()}
          >
            {busy ?? "Run / refresh simulation"}
          </Button>
        </div>

        {err ? (
          <p className="text-sm text-amber-800">{err}</p>
        ) : null}
        {loading && !summary ? (
          <p className="text-xs text-ink-muted">Loading…</p>
        ) : null}
      </Card>

      {summary ? (
        <Card className="space-y-2 border-slate-200/80 bg-slate-50/40 p-4">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h3 className="text-sm font-semibold text-ink">Resilience summary</h3>
            <span className="rounded-full bg-white px-2 py-0.5 text-[11px] font-medium text-ink shadow-sm">
              {resilienceLabel(summary.overallResilience)}
            </span>
          </div>
          <div className="grid gap-2 text-xs text-ink-muted sm:grid-cols-2 lg:grid-cols-4">
            <p>
              Scenarios: <span className="font-medium text-ink">{summary.scenarioCount}</span>
            </p>
            <p>
              Critical impact:{" "}
              <span className="font-medium text-ink">{summary.criticalScenarioCount}</span>
            </p>
            <p>
              High likelihood:{" "}
              <span className="font-medium text-ink">{summary.highLikelihoodCount}</span>
            </p>
            <p>
              Weak / unknown preparedness:{" "}
              <span className="font-medium text-ink">{summary.lowPreparednessCount}</span>
            </p>
          </div>
          {summary.decisionWarnings.length > 0 ? (
            <div>
              <p className="text-[10px] font-medium uppercase text-amber-900/80">
                Decision warnings
              </p>
              <ul className="mt-1 list-inside list-disc text-xs text-amber-950/90">
                {summary.decisionWarnings.map((w, i) => (
                  <li key={i}>{w}</li>
                ))}
              </ul>
            </div>
          ) : null}
          {summary.topMitigations.length > 0 ? (
            <div>
              <p className="text-[10px] font-medium uppercase text-ink-subtle">
                Mitigation / contrast signals
              </p>
              <ul className="mt-1 list-inside list-disc text-xs text-ink-muted">
                {summary.topMitigations.map((m, i) => (
                  <li key={i}>{m}</li>
                ))}
              </ul>
            </div>
          ) : null}
        </Card>
      ) : !loading && !err ? (
        <p className="text-sm text-ink-muted">
          No stored failure modes yet — run simulation after fit, integration rows, and claim
          validation for best signal.
        </p>
      ) : null}

      <div className="flex flex-wrap gap-2 border-b border-border pb-2">
        {STRESS_TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setStress(t.id)}
            className={`rounded-md px-2.5 py-1 text-[11px] font-medium ${
              stress === t.id
                ? "bg-ink text-white"
                : "bg-slate-100 text-ink-muted hover:bg-slate-200"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {filtered.length === 0 && modes.length > 0 ? (
        <p className="text-xs text-ink-muted">No scenarios in this stress family.</p>
      ) : null}

      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="w-full border-collapse text-left text-xs">
          <thead>
            <tr className="border-b border-border bg-zinc-50/90">
              <th className="px-2 py-2">Scenario</th>
              <th className="px-2 py-2">L</th>
              <th className="px-2 py-2">I</th>
              <th className="px-2 py-2">Recover</th>
              <th className="px-2 py-2">Prep</th>
              <th className="px-2 py-2">Evidence</th>
              <th className="px-2 py-2 min-w-[180px]">Rationale</th>
              <th className="px-2 py-2">Δ counts</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((m) => (
              <tr key={m.id} className="border-b border-border align-top">
                <td className="px-2 py-2">
                  <p className="font-medium text-ink">{m.title}</p>
                  <p className="mt-0.5 text-[10px] text-ink-subtle">{m.scenarioKey}</p>
                </td>
                <td className="px-2 py-2 capitalize">{m.likelihood}</td>
                <td className="px-2 py-2 capitalize">{m.impact}</td>
                <td className="px-2 py-2 capitalize">{m.recoverability}</td>
                <td className="px-2 py-2 capitalize">{m.vendorPreparedness}</td>
                <td className="px-2 py-2 capitalize">{m.evidenceStrength}</td>
                <td className="px-2 py-2 text-ink-muted">{m.rationale}</td>
                <td className="px-2 py-2 whitespace-nowrap">
                  T {m.triggerConditions.length} · M {m.mitigationSignals.length} · U{" "}
                  {m.unresolvedUnknowns.length}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
