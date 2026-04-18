import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Select } from "@/components/ui/Select";
import {
  fetchGroundingBundles,
  postBuildGroundingBundle,
} from "@/lib/functions-api";
import {
  assessGroundingBundleQuality,
  getGroundingBundleStats,
} from "@/lib/drafting-utils";
import type {
  DraftSectionType,
  GroundingBundlePayload,
  GroundingBundleType,
} from "@/types";
import { GROUNDING_BUNDLE_TYPES } from "@/types";
import type { SelectedBundle } from "@/context/drafting-context";
import { GroundingBundleQualityBadge } from "./GroundingBundleQualityBadge";
import { GroundingBundleStatsRow } from "./GroundingBundleStats";

/** Map draft section → default grounding bundle type for “build”. */
function bundleTypeForSection(sectionType: DraftSectionType): GroundingBundleType {
  if (sectionType === "Architecture Narrative") return "architecture_narrative";
  if (sectionType === "Executive Summary") return "Executive Summary";
  return sectionType;
}

type BundleRow = {
  id: string;
  bundleType: string;
  title: string;
  createdAt: string;
  payload: GroundingBundlePayload;
};

function formatListDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

type GroundingBundleSelectorProps = {
  projectId: string;
  sectionType: DraftSectionType;
  selected: SelectedBundle | null;
  onSelect: (bundle: SelectedBundle | null) => void;
};

export function GroundingBundleSelector({
  projectId,
  sectionType,
  selected,
  onSelect,
}: GroundingBundleSelectorProps) {
  const [bundles, setBundles] = useState<BundleRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");
  const [buildType, setBuildType] = useState<GroundingBundleType>(
    bundleTypeForSection(sectionType),
  );

  const configured = Boolean(
    (import.meta.env.VITE_FUNCTIONS_BASE_URL ?? "").trim(),
  );

  const refresh = async () => {
    if (!projectId.trim() || !configured) return;
    setLoading(true);
    setMsg("");
    try {
      const rows = await fetchGroundingBundles(projectId.trim());
      setBundles(rows);
    } catch (e) {
      setMsg(
        e instanceof Error ? e.message : "Could not load grounding bundles",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId, configured]);

  return (
    <Card className="space-y-3 p-4">
      <div>
        <h2 className="text-sm font-semibold text-ink">Grounding bundle</h2>
        <p className="text-xs text-ink-muted">
          Choose a grounding bundle to inspect scope, evidence, and gaps before
          generation. Each row shows counts and strength so you can review like an
          evidence packet — not a raw payload dump.
        </p>
      </div>

      {!configured ? (
        <div className="rounded-md border border-zinc-200 bg-zinc-50/60 px-3 py-2 text-xs text-ink-muted">
          <p className="font-medium text-ink">API not configured</p>
          <p className="mt-1">
            Set <code className="rounded bg-white/90 px-1">VITE_FUNCTIONS_BASE_URL</code>{" "}
            to list or build grounding bundles from the project database.
          </p>
        </div>
      ) : null}

      {!projectId.trim() ? (
        <div className="rounded-md border border-dashed border-zinc-300 bg-zinc-50/40 px-3 py-3 text-xs text-ink-muted">
          <p className="font-medium text-ink">No project ID</p>
          <p className="mt-1">
            Set <code className="rounded bg-white/90 px-1">VITE_DEFAULT_PROJECT_ID</code>{" "}
            so grounding bundles can load for this workspace.
          </p>
        </div>
      ) : null}

      {configured && projectId.trim() ? (
        <>
          {loading && bundles.length === 0 ? (
            <p className="text-xs text-ink-muted">Loading grounding bundles…</p>
          ) : null}

          {!loading && bundles.length === 0 ? (
            <div className="rounded-md border border-dashed border-zinc-300 bg-zinc-50/40 px-3 py-3 text-xs text-ink-muted">
              <p className="font-medium text-ink">No grounding bundles in this project</p>
              <p className="mt-1">
                Build a new grounding bundle below, or refresh after creating one
                elsewhere.
              </p>
            </div>
          ) : null}
        </>
      ) : null}

      <div className="flex flex-wrap items-center gap-2">
        <Button
          type="button"
          variant="secondary"
          disabled={loading || !projectId.trim() || !configured}
          onClick={() => void refresh()}
        >
          {loading ? "Refreshing…" : "Refresh list"}
        </Button>
      </div>

      {bundles.length > 0 ? (
        <div className="space-y-2">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-ink-subtle">
            Project grounding bundles
          </p>
          <ul className="max-h-[min(22rem,50vh)] space-y-2 overflow-y-auto pr-1">
            <li>
              <button
                type="button"
                onClick={() => onSelect(null)}
                className={`w-full rounded-lg border px-3 py-2.5 text-left text-xs transition-colors ${
                  !selected
                    ? "border-zinc-400 bg-white shadow-sm"
                    : "border-dashed border-zinc-300 bg-zinc-50/40 text-ink-muted hover:bg-zinc-50/70"
                }`}
              >
                <span className="font-medium text-ink">None selected</span>
                <p className="mt-0.5 text-ink-muted">Clear attachment for this section</p>
              </button>
            </li>
            {bundles.map((b) => {
              const stats = getGroundingBundleStats(b.payload);
              const quality = assessGroundingBundleQuality(b.payload);
              const isActive = selected?.id === b.id;
              const displayTitle =
                b.title?.trim() || b.payload.title?.trim() || "Untitled grounding bundle";
              return (
                <li key={b.id}>
                  <button
                    type="button"
                    onClick={() =>
                      onSelect({
                        id: b.id,
                        payload: b.payload,
                        listCreatedAt: b.createdAt,
                      })
                    }
                    className={`w-full rounded-lg border px-3 py-2.5 text-left transition-colors ${
                      isActive
                        ? "border-zinc-400 bg-white shadow-sm"
                        : "border-border bg-surface-raised hover:border-zinc-300 hover:bg-zinc-50/50"
                    }`}
                  >
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-semibold text-ink">{displayTitle}</p>
                        <p className="mt-0.5 text-[11px] text-ink-muted">
                          <span className="text-ink-subtle">Type</span> {b.bundleType}
                          <span className="mx-1.5 text-ink-subtle">·</span>
                          <span className="text-ink-subtle">Stored</span>{" "}
                          {formatListDate(b.createdAt)}
                        </p>
                      </div>
                      <GroundingBundleQualityBadge
                        label={quality.label}
                        title={quality.reasons.join(" ")}
                      />
                    </div>
                    <div className="mt-2">
                      <GroundingBundleStatsRow stats={stats} variant="inline" />
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      ) : null}

      <div className="rounded-md border border-dashed border-border p-3">
        <p className="text-xs font-medium text-ink">Build new grounding bundle</p>
        <div className="mt-2 flex flex-wrap items-end gap-2">
          <label className="block min-w-[8rem] flex-1 space-y-1">
            <span className="text-xs text-ink-muted">Type</span>
            <Select
              value={buildType}
              onChange={(e) =>
                setBuildType(e.target.value as GroundingBundleType)
              }
            >
              {GROUNDING_BUNDLE_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </Select>
          </label>
          <Button
            type="button"
            variant="secondary"
            disabled={!projectId.trim() || !configured}
            onClick={() => {
              void (async () => {
                setMsg("");
                try {
                  const r = await postBuildGroundingBundle({
                    projectId: projectId.trim(),
                    bundleType: buildType,
                  });
                  onSelect({
                    id: r.bundleId,
                    payload: r.payload,
                    listCreatedAt: new Date().toISOString(),
                  });
                  setMsg(`Attached new bundle ${r.bundleId.slice(0, 8)}…`);
                  await refresh();
                } catch (e) {
                  setMsg(e instanceof Error ? e.message : "Build failed");
                }
              })();
            }}
          >
            Build and attach
          </Button>
        </div>
      </div>

      {selected ? (
        <div className="space-y-2 rounded-md border border-zinc-200/80 bg-white p-3 text-xs text-ink-muted">
          <p>
            <span className="font-medium text-ink">Attached for this section:</span>{" "}
            <span className="font-mono text-[11px]">{selected.id.slice(0, 8)}…</span>
          </p>
          <GroundingBundleStatsRow
            stats={getGroundingBundleStats(selected.payload)}
            variant="inline"
          />
          <p className="text-[11px] text-ink-subtle">
            Full structured preview appears below — confirm gaps before generating.
          </p>
        </div>
      ) : (
        <div className="rounded-md border border-dashed border-zinc-300 bg-zinc-50/35 px-3 py-3 text-xs text-ink-muted">
          <p className="font-medium text-ink">No grounding bundle selected</p>
          <p className="mt-1">
            Select a project grounding bundle above or build one. Generation stays
            blocked until a bundle with substantive content is attached.
          </p>
        </div>
      )}

      {msg ? <p className="text-xs text-ink-muted">{msg}</p> : null}
    </Card>
  );
}
