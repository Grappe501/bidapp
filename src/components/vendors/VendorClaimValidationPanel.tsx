import { useCallback, useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import { postVendorIntelligence } from "@/lib/functions-api";
import type { VendorClaimValidationRecord } from "@/types";

type FilterMode = "all" | "weak" | "contradicted" | "critical";

function SupportBadge({ level }: { level: string }) {
  const c =
    level === "strong"
      ? "bg-emerald-100 text-emerald-900"
      : level === "moderate"
        ? "bg-amber-100 text-amber-900"
        : level === "weak"
          ? "bg-orange-100 text-orange-900"
          : "bg-slate-200 text-slate-800";
  return (
    <span className={`rounded px-2 py-0.5 text-[10px] font-medium ${c}`}>
      {level}
    </span>
  );
}

function ContraBadge({ s }: { s: string }) {
  if (s === "none") {
    return <span className="text-[10px] text-ink-subtle">none</span>;
  }
  const c = s === "clear" ? "bg-red-100 text-red-900" : "bg-amber-100 text-amber-900";
  return (
    <span className={`rounded px-2 py-0.5 text-[10px] font-medium ${c}`}>
      {s}
    </span>
  );
}

export function VendorClaimValidationPanel(props: {
  projectId: string;
  vendorId: string;
  onRefreshSnapshot?: () => Promise<void>;
}) {
  const [rows, setRows] = useState<VendorClaimValidationRecord[]>([]);
  const [filter, setFilter] = useState<FilterMode>("all");
  const [busy, setBusy] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setErr(null);
    try {
      const res = (await postVendorIntelligence({
        projectId: props.projectId,
        vendorId: props.vendorId,
        action: "listClaimValidations",
      })) as { validations: VendorClaimValidationRecord[] };
      setRows(res.validations ?? []);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Failed to load");
      setRows([]);
    }
  }, [props.projectId, props.vendorId]);

  useEffect(() => {
    void load();
  }, [load]);

  const summary = useMemo(() => {
    let strong = 0;
    let weak = 0;
    let contra = 0;
    let fu = 0;
    for (const r of rows) {
      if (r.effectiveSupportLevel === "strong") strong++;
      if (r.effectiveSupportLevel === "weak" || r.effectiveSupportLevel === "none")
        weak++;
      if (r.contradictionStatus !== "none") contra++;
      if (r.needsFollowUp) fu++;
    }
    return { strong, weak, contra, fu };
  }, [rows]);

  const filtered = useMemo(() => {
    return rows.filter((r) => {
      if (filter === "weak")
        return r.effectiveSupportLevel === "weak" || r.effectiveSupportLevel === "none";
      if (filter === "contradicted") return r.contradictionStatus !== "none";
      if (filter === "critical") return r.isCritical;
      return true;
    });
  }, [rows, filter]);

  const runValidation = async () => {
    setBusy("run");
    setErr(null);
    try {
      await postVendorIntelligence({
        projectId: props.projectId,
        vendorId: props.vendorId,
        action: "runClaimValidation",
      });
      await load();
      await props.onRefreshSnapshot?.();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Run failed");
    } finally {
      setBusy(null);
    }
  };

  const savePatch = async (id: string, patch: Record<string, unknown>) => {
    setBusy("save");
    setErr(null);
    try {
      const res = (await postVendorIntelligence({
        projectId: props.projectId,
        vendorId: props.vendorId,
        action: "patchClaimValidation",
        validationId: id,
        patch,
      })) as { validations: VendorClaimValidationRecord[] };
      setRows(res.validations ?? []);
      setEditingId(null);
      await props.onRefreshSnapshot?.();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Save failed");
    } finally {
      setBusy(null);
    }
  };

  return (
    <Card className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-sm font-semibold text-ink">Claim validation</h2>
        <div className="flex flex-wrap gap-2">
          <Select
            value={filter}
            onChange={(e) => setFilter(e.target.value as FilterMode)}
          >
            <option value="all">All claims</option>
            <option value="weak">Weak / none only</option>
            <option value="contradicted">Contradiction signals</option>
            <option value="critical">Critical only</option>
          </Select>
          <Button
            type="button"
            variant="secondary"
            disabled={busy !== null}
            onClick={() => void runValidation()}
          >
            {busy === "run" ? "Running…" : "Run validation"}
          </Button>
        </div>
      </div>
      <p className="text-xs text-ink-muted">
        Normalizes vendor claims to taxonomy keys, scores evidence from claims, facts, and
        interview text, and nudges scoring when proof is thin. Machine rationale is
        preserved when you add notes or overrides.
      </p>
      {err ? <p className="text-sm text-amber-800">{err}</p> : null}
      <div className="grid gap-2 rounded border border-border bg-slate-50 p-3 text-xs text-ink-muted sm:grid-cols-4">
        <div>
          <span className="font-medium text-ink">Strong</span> — {summary.strong}
        </div>
        <div>
          <span className="font-medium text-ink">Weak / none</span> — {summary.weak}
        </div>
        <div>
          <span className="font-medium text-ink">Contradiction signals</span> —{" "}
          {summary.contra}
        </div>
        <div>
          <span className="font-medium text-ink">Follow-up</span> — {summary.fu}
        </div>
      </div>
      {filtered.length === 0 ? (
        <p className="text-sm text-ink-muted">
          No rows for this filter. Run validation after research or interview capture.
        </p>
      ) : (
        <ul className="space-y-3">
          {filtered.map((r) => (
            <li
              key={r.id}
              className="rounded border border-border p-3 text-sm text-ink-muted"
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="font-medium text-ink">{r.claimText}</p>
                  <p className="mt-1 text-[11px] text-ink-subtle">
                    Key: {r.normalizedClaimKey} · {r.claimCategory} · {r.claimSourceType}
                  </p>
                </div>
                <div className="flex flex-wrap gap-1">
                  <SupportBadge level={r.effectiveSupportLevel} />
                  <ContraBadge s={r.contradictionStatus} />
                  <span className="rounded bg-slate-100 px-2 py-0.5 text-[10px] text-ink">
                    {r.confidence} conf
                  </span>
                  {r.isCritical ? (
                    <span className="rounded bg-rose-100 px-2 py-0.5 text-[10px] text-rose-900">
                      critical
                    </span>
                  ) : null}
                  {r.needsFollowUp ? (
                    <span className="rounded bg-amber-50 px-2 py-0.5 text-[10px] text-amber-900">
                      follow-up
                    </span>
                  ) : null}
                </div>
              </div>
              <p className="mt-2 text-xs">{r.rationale}</p>
              {r.humanNote ? (
                <p className="mt-1 text-xs text-ink">
                  <span className="font-medium">Human note:</span> {r.humanNote}
                </p>
              ) : null}
              <p className="mt-1 text-[10px] text-ink-subtle">
                Evidence: {r.supportingFactIds.length} supporting fact id(s),{" "}
                {r.contradictingFactIds.length} contradicting · sources{" "}
                {r.evidenceSourceIds.length}
              </p>
              {editingId === r.id ? (
                <EditRow
                  row={r}
                  busy={busy === "save"}
                  onCancel={() => setEditingId(null)}
                  onSave={(patch) => void savePatch(r.id, patch)}
                />
              ) : (
                <div className="mt-2 flex gap-2">
                  <Button
                    type="button"
                    variant="secondary"
                    className="text-xs"
                    onClick={() => setEditingId(r.id)}
                  >
                    Edit / curate
                  </Button>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}

function EditRow(props: {
  row: VendorClaimValidationRecord;
  busy: boolean;
  onCancel: () => void;
  onSave: (patch: Record<string, unknown>) => void;
}) {
  const { row } = props;
  const [claimText, setClaimText] = useState(row.claimText);
  const [humanNote, setHumanNote] = useState(row.humanNote);
  const [isCritical, setIsCritical] = useState(row.isCritical);
  const [override, setOverride] = useState(row.supportLevelOverride ?? "");

  return (
    <div className="mt-3 space-y-2 border-t border-border pt-3">
      <label className="block text-xs">
        <span className="text-ink-muted">Claim text (locks on save)</span>
        <Textarea
          rows={2}
          value={claimText}
          onChange={(e) => setClaimText(e.target.value)}
          className="mt-1"
        />
      </label>
      <label className="block text-xs">
        <span className="text-ink-muted">Human note (preserved across re-runs)</span>
        <Textarea
          rows={2}
          value={humanNote}
          onChange={(e) => setHumanNote(e.target.value)}
          className="mt-1"
        />
      </label>
      <label className="flex items-center gap-2 text-xs">
        <input
          type="checkbox"
          checked={isCritical}
          onChange={(e) => setIsCritical(e.target.checked)}
        />
        Mark critical
      </label>
      <label className="block text-xs">
        <span className="text-ink-muted">Support override (optional)</span>
        <Select
          value={override}
          onChange={(e) => setOverride(e.target.value)}
        >
          <option value="">(use machine)</option>
          <option value="none">none</option>
          <option value="weak">weak</option>
          <option value="moderate">moderate</option>
          <option value="strong">strong</option>
        </Select>
      </label>
      <p className="text-[10px] text-ink-subtle">
        Machine rationale (read-only): {row.machineRationale.slice(0, 280)}
        {row.machineRationale.length > 280 ? "…" : ""}
      </p>
      <div className="flex gap-2">
        <Button
          type="button"
          disabled={props.busy}
          onClick={() =>
            props.onSave({
              claimText,
              claimTextLocked: true,
              humanNote,
              isCritical,
              supportLevelOverride: override === "" ? null : override,
            })
          }
        >
          {props.busy ? "Saving…" : "Save"}
        </Button>
        <Button type="button" variant="secondary" onClick={props.onCancel}>
          Cancel
        </Button>
      </div>
    </div>
  );
}
