import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Select } from "@/components/ui/Select";
import { postVendorIntelligence } from "@/lib/functions-api";
import type { VendorRoleFitRecord, VendorRoleFitSummary } from "@/types";

function assessmentLabel(
  a: VendorRoleFitSummary["roleStrategyAssessment"],
): string {
  switch (a) {
    case "clear_fit":
      return "Clear fit";
    case "usable_with_malone_support":
      return "Usable with Malone support";
    case "fragile":
      return "Fragile";
    case "misaligned":
      return "Misaligned";
    default:
      return a;
  }
}

export function VendorRoleFitPanel(props: {
  projectId: string;
  vendorId: string;
  architectureOptions: { id: string; name: string }[];
  onAfterRun?: () => void;
}) {
  const { projectId, vendorId, architectureOptions, onAfterRun } = props;
  const [archId, setArchId] = useState<string>("");
  const [summary, setSummary] = useState<VendorRoleFitSummary | null>(null);
  const [roles, setRoles] = useState<VendorRoleFitRecord[]>([]);
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
        action: "listRoleFit",
      })) as {
        summary: VendorRoleFitSummary | null;
        roles: VendorRoleFitRecord[];
      };
      setSummary(res.summary);
      setRoles(res.roles);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Failed to load role fit");
      setSummary(null);
      setRoles([]);
    } finally {
      setLoading(false);
    }
  }, [projectId, vendorId]);

  useEffect(() => {
    void load();
  }, [load]);

  const runAnalysis = async () => {
    setBusy("Running role analysis…");
    setErr(null);
    try {
      const arch = archId.trim() === "" ? undefined : archId.trim();
      const res = (await postVendorIntelligence({
        projectId,
        vendorId,
        action: "runRoleFitAnalysis",
        architectureOptionId: arch,
      })) as { summary: VendorRoleFitSummary };
      setSummary(res.summary);
      await load();
      onAfterRun?.();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Analysis failed");
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="space-y-4">
      <Card className="space-y-3 p-4">
        <div>
          <h2 className="text-sm font-semibold text-ink">Role fit & ownership</h2>
          <p className="mt-1 text-xs text-ink-muted">
            Maps vendor vs Malone vs shared roles for this bid (S479). Marketing language does not
            imply ownership — evidence and fit dimensions drive recommendations.
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
            onClick={() => void runAnalysis()}
          >
            {busy ?? "Run / refresh analysis"}
          </Button>
        </div>
        {err ? <p className="text-sm text-amber-800">{err}</p> : null}
        {loading && !summary ? (
          <p className="text-xs text-ink-muted">Loading…</p>
        ) : null}
      </Card>

      {summary ? (
        <Card className="space-y-2 border-slate-200/80 bg-slate-50/40 p-4">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h3 className="text-sm font-semibold text-ink">Strategy</h3>
            <span className="rounded-full bg-white px-2 py-0.5 text-[11px] font-medium text-ink shadow-sm">
              {assessmentLabel(summary.roleStrategyAssessment)}
            </span>
          </div>
          <div className="grid gap-2 text-xs text-ink-muted sm:grid-cols-2">
            <p>
              Strong own:{" "}
              <span className="font-medium text-ink">{summary.strongOwnRoles.length}</span>
            </p>
            <p>
              Shared:{" "}
              <span className="font-medium text-ink">{summary.shareRoles.length}</span>
            </p>
            <p>
              Support:{" "}
              <span className="font-medium text-ink">{summary.supportRoles.length}</span>
            </p>
            <p>
              Avoid:{" "}
              <span className="font-medium text-ink">{summary.avoidRoles.length}</span>
            </p>
          </div>
          {summary.highestDependencyRoles.length > 0 ? (
            <p className="text-[11px] text-amber-950/90">
              Highest Malone dependency:{" "}
              {summary.highestDependencyRoles.slice(0, 6).join(", ")}
            </p>
          ) : null}
          {summary.highestHandoffRiskRoles.length > 0 ? (
            <p className="text-[11px] text-ink-muted">
              Handoff complexity:{" "}
              {summary.highestHandoffRiskRoles.slice(0, 6).join(", ")}
            </p>
          ) : null}
        </Card>
      ) : !loading && !err ? (
        <p className="text-sm text-ink-muted">
          No stored role-fit rows — run analysis after fit, integration, and claim validation.
        </p>
      ) : null}

      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="w-full border-collapse text-left text-xs">
          <thead>
            <tr className="border-b border-border bg-zinc-50/90">
              <th className="px-2 py-2">Role</th>
              <th className="px-2 py-2">Ownership</th>
              <th className="px-2 py-2">Fit</th>
              <th className="px-2 py-2">Malone dep.</th>
              <th className="px-2 py-2">Handoff</th>
              <th className="px-2 py-2">Overlap</th>
              <th className="px-2 py-2">Gap</th>
              <th className="px-2 py-2 min-w-[160px]">Rationale</th>
            </tr>
          </thead>
          <tbody>
            {roles.map((r) => (
              <tr key={r.id} className="border-b border-border align-top">
                <td className="px-2 py-2">
                  <p className="font-medium text-ink">{r.roleLabel}</p>
                  <p className="text-[10px] text-ink-subtle">{r.roleKey}</p>
                </td>
                <td className="px-2 py-2 capitalize">{r.ownershipRecommendation}</td>
                <td className="px-2 py-2 capitalize">{r.fitLevel}</td>
                <td className="px-2 py-2 capitalize">{r.maloneDependencyLevel}</td>
                <td className="px-2 py-2 capitalize">{r.handoffComplexity}</td>
                <td className="px-2 py-2 capitalize">{r.overlapRisk}</td>
                <td className="px-2 py-2 capitalize">{r.gapRisk}</td>
                <td className="px-2 py-2 text-ink-muted">{r.rationale}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
