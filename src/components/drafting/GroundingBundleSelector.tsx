import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Select } from "@/components/ui/Select";
import {
  fetchGroundingBundles,
  postBuildGroundingBundle,
} from "@/lib/functions-api";
import type {
  DraftSectionType,
  GroundingBundlePayload,
  GroundingBundleType,
} from "@/types";
import { GROUNDING_BUNDLE_TYPES } from "@/types";
import type { SelectedBundle } from "@/context/drafting-context";

/** Map draft section → default grounding bundle type for “build”. */
function bundleTypeForSection(sectionType: DraftSectionType): GroundingBundleType {
  if (sectionType === "Architecture Narrative") return "architecture_narrative";
  if (sectionType === "Executive Summary") return "Executive Summary";
  return sectionType;
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
  const [bundles, setBundles] = useState<
    {
      id: string;
      bundleType: string;
      title: string;
      createdAt: string;
      payload: GroundingBundlePayload;
    }[]
  >([]);
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
      setMsg(e instanceof Error ? e.message : "Failed to load bundles");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void refresh();
    // Intentionally reload when project / functions config changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId, configured]);

  return (
    <Card className="space-y-3 p-4">
      <div>
        <h2 className="text-sm font-semibold text-ink">Grounding bundle</h2>
        <p className="text-xs text-ink-muted">
          Drafting requires a bundle: requirements, evidence, chunks, and gaps
          exposed to the model.
        </p>
      </div>

      {!configured ? (
        <p className="text-xs text-amber-900/90">
          Set VITE_FUNCTIONS_BASE_URL to list or build bundles from Postgres.
        </p>
      ) : null}

      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          variant="secondary"
          disabled={loading || !projectId.trim()}
          onClick={() => void refresh()}
        >
          Refresh list
        </Button>
        <label className="flex min-w-[10rem] flex-1 items-center gap-2">
          <span className="text-xs text-ink-muted">Existing</span>
          <Select
            className="flex-1"
            value={selected?.id ?? ""}
            onChange={(e) => {
              const id = e.target.value;
              if (!id) {
                onSelect(null);
                return;
              }
              const row = bundles.find((b) => b.id === id);
              if (row) onSelect({ id: row.id, payload: row.payload });
            }}
            aria-label="Select grounding bundle"
          >
            <option value="">— Select —</option>
            {bundles.map((b) => (
              <option key={b.id} value={b.id}>
                {b.bundleType}: {b.title.slice(0, 48)}
              </option>
            ))}
          </Select>
        </label>
      </div>

      <div className="rounded-md border border-dashed border-border p-3">
        <p className="text-xs font-medium text-ink">Build new bundle</p>
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
                  onSelect({ id: r.bundleId, payload: r.payload });
                  setMsg(`Built bundle ${r.bundleId}`);
                  await refresh();
                } catch (e) {
                  setMsg(e instanceof Error ? e.message : "Build failed");
                }
              })();
            }}
          >
            Build &amp; attach
          </Button>
        </div>
      </div>

      {selected ? (
        <div className="space-y-2 rounded-md bg-white p-3 text-xs text-ink-muted">
          <p>
            <span className="font-medium text-ink">Attached:</span>{" "}
            {selected.id}
          </p>
          <p>
            Requirements: {selected.payload.requirements.length} · Evidence:{" "}
            {selected.payload.evidence.length} · Chunks:{" "}
            {selected.payload.retrievedChunks.length} · Facts:{" "}
            {selected.payload.vendorFacts.length}
          </p>
          {selected.payload.gaps.length > 0 ? (
            <div>
              <span className="font-medium text-ink">Gaps:</span>
              <ul className="mt-1 list-inside list-disc">
                {selected.payload.gaps.slice(0, 5).map((g) => (
                  <li key={g.slice(0, 40)}>{g}</li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
      ) : (
        <p className="text-xs text-amber-900/80">
          Select or build a grounding bundle before generating a draft.
        </p>
      )}

      {msg ? <p className="text-xs text-ink-muted">{msg}</p> : null}
    </Card>
  );
}
