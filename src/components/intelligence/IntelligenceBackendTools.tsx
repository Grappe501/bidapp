import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import {
  postBuildGroundingBundle,
  postEnrichCompany,
  postIntelligenceJobStatus,
  postIntelligenceProfileSnapshot,
} from "@/lib/functions-api";
import { GROUNDING_BUNDLE_TYPES, type GroundingBundleType } from "@/types";

export function IntelligenceBackendTools() {
  const [projectId, setProjectId] = useState(
    () => import.meta.env.VITE_DEFAULT_PROJECT_ID ?? "",
  );
  const [companyProfileId, setCompanyProfileId] = useState("");
  const [bundleType, setBundleType] = useState<GroundingBundleType>("Solution");
  const [statusText, setStatusText] = useState("");
  const [busy, setBusy] = useState(false);

  const configured = Boolean(
    (import.meta.env.VITE_FUNCTIONS_BASE_URL ?? "").trim(),
  );

  const withBusy = async (fn: () => Promise<void>) => {
    setBusy(true);
    setStatusText("");
    try {
      await fn();
    } catch (e) {
      setStatusText(e instanceof Error ? e.message : "Request failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card className="space-y-4 border-zinc-400/30 bg-zinc-50/50">
      <div>
        <h3 className="text-sm font-semibold text-ink">
          Persisted intelligence — jobs &amp; grounding
        </h3>
        <p className="mt-1 text-xs text-ink-muted">
          Manual triggers only. Uses stored sources and parsed documents — not
          live web research. Requires{" "}
          <code className="rounded bg-zinc-100 px-1">DATABASE_URL</code>,{" "}
          <code className="rounded bg-zinc-100 px-1">OPENAI_API_KEY</code> on
          the function runtime, and{" "}
          <code className="rounded bg-zinc-100 px-1">VITE_FUNCTIONS_BASE_URL</code>
          .
        </p>
      </div>

      {!configured ? (
        <p className="text-sm text-amber-900/90">
          Functions base URL not set — configure{" "}
          <code className="rounded bg-zinc-100 px-1">VITE_FUNCTIONS_BASE_URL</code>{" "}
          to use these actions.
        </p>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block space-y-1.5">
          <span className="text-xs font-medium text-ink-muted">Project ID</span>
          <Input
            value={projectId}
            onChange={(e) => setProjectId(e.target.value)}
            placeholder="UUID from seed / list-projects"
          />
        </label>
        <label className="block space-y-1.5">
          <span className="text-xs font-medium text-ink-muted">
            Company profile ID
          </span>
          <Input
            value={companyProfileId}
            onChange={(e) => setCompanyProfileId(e.target.value)}
            placeholder="UUID — client or vendor profile row"
          />
        </label>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          variant="secondary"
          disabled={busy || !companyProfileId.trim()}
          onClick={() =>
            withBusy(async () => {
              const r = await postEnrichCompany(companyProfileId.trim());
              setStatusText(
                `Enrichment run ${r.runId}: ${r.factsCreated} facts, ${r.claimsCreated} vendor claims (from stored sources).`,
              );
            })
          }
        >
          Enrich company
        </Button>
        <Button
          type="button"
          variant="secondary"
          disabled={busy || !companyProfileId.trim()}
          onClick={() =>
            withBusy(async () => {
              const snap = await postIntelligenceProfileSnapshot(
                companyProfileId.trim(),
              );
              setStatusText(
                `Sources: ${snap.sources.length}; facts: ${snap.facts.length}. ` +
                  `First source: ${snap.sources[0]?.id ?? "—"}; first fact: ${snap.facts[0]?.id ?? "—"}.`,
              );
            })
          }
        >
          View sources &amp; facts
        </Button>
        <Button
          type="button"
          variant="secondary"
          disabled={busy || !projectId.trim()}
          onClick={() =>
            withBusy(async () => {
              const s = await postIntelligenceJobStatus(projectId.trim());
              setStatusText(
                `Embeddings: ${s.embeddingCount}; parsed entities: ${s.parsedEntityCount}; ` +
                  `grounding bundles: ${s.groundingBundleCount}; enrichment runs (project): ${s.enrichmentRunCount}.`,
              );
            })
          }
        >
          Job status
        </Button>
      </div>

      <div className="flex flex-wrap items-end gap-2 border-t border-border pt-3">
        <label className="block min-w-[12rem] flex-1 space-y-1.5">
          <span className="text-xs font-medium text-ink-muted">
            Grounding bundle type
          </span>
          <Select
            value={bundleType}
            onChange={(e) =>
              setBundleType(e.target.value as GroundingBundleType)
            }
            aria-label="Grounding bundle type"
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
          disabled={busy || !projectId.trim()}
          onClick={() =>
            withBusy(async () => {
              const r = await postBuildGroundingBundle({
                projectId: projectId.trim(),
                bundleType,
              });
              setStatusText(
                `Stored bundle ${r.bundleId} (${r.payload.retrievedChunks.length} chunks, ` +
                  `${r.payload.requirements.length} requirements, ${r.payload.evidence.length} evidence).`,
              );
            })
          }
        >
          Build grounding bundle
        </Button>
      </div>

      {statusText ? (
        <p className="rounded-md border border-border bg-white px-3 py-2 text-xs text-ink-muted">
          {statusText}
        </p>
      ) : null}
    </Card>
  );
}
