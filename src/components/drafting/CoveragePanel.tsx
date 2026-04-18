import { Card } from "@/components/ui/Card";
import {
  analyzeRequirementCoverage,
  countBundleWeakVerificationEvidence,
} from "@/lib/drafting-utils";
import type { DraftMetadata, GroundingBundlePayload } from "@/types";

type CoveragePanelProps = {
  bundle: GroundingBundlePayload | null;
  metadata: DraftMetadata | null;
};

function CountPill({ label, value, tone }: { label: string; value: number; tone?: "default" | "warn" | "ok" }) {
  const toneCls =
    tone === "warn"
      ? "border-amber-200/90 bg-amber-50/50"
      : tone === "ok"
        ? "border-emerald-200/80 bg-emerald-50/40"
        : "border-zinc-200 bg-zinc-50/80";
  return (
    <div className={`rounded-md border px-2.5 py-1.5 text-center ${toneCls}`}>
      <p className="text-lg font-semibold tabular-nums text-ink">{value}</p>
      <p className="text-[10px] font-medium uppercase tracking-wide text-ink-subtle">
        {label}
      </p>
    </div>
  );
}

function ReqList({
  title,
  rows,
  variant,
}: {
  title: string;
  rows: { id: string; label: string; subtitle?: string }[];
  variant: "covered" | "missing" | "weak";
}) {
  if (rows.length === 0) {
    return (
      <div className="text-[11px] text-ink-subtle">
        <span className="font-medium text-ink">{title}:</span> none in this snapshot.
      </div>
    );
  }

  const border =
    variant === "missing"
      ? "border-l-amber-400/90"
      : variant === "weak"
        ? "border-l-zinc-400"
        : "border-l-emerald-400/70";

  return (
    <div className="space-y-1.5">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-ink-subtle">
        {title}
      </p>
      <ul className="max-h-36 space-y-2 overflow-y-auto text-[11px]">
        {rows.map((r) => (
          <li
            key={r.id}
            className={`border-b border-zinc-100 pb-2 pl-2 ${border} border-l-2`}
          >
            <span className="font-medium text-ink">{r.label}</span>
            {r.subtitle ? (
              <p className="mt-0.5 leading-snug text-ink-muted">{r.subtitle}</p>
            ) : null}
            <p className="mt-0.5 font-mono text-[10px] text-ink-subtle">
              ID: {r.id.length > 20 ? `${r.id.slice(0, 18)}…` : r.id}
            </p>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function CoveragePanel({ bundle, metadata }: CoveragePanelProps) {
  const analysis = analyzeRequirementCoverage(bundle, metadata);

  return (
    <Card className="space-y-4 p-4">
      <div>
        <h2 className="text-sm font-semibold text-ink">Requirement coverage</h2>
        <p className="mt-1 text-xs leading-relaxed text-ink-muted">
          <span className="font-medium text-ink">Covered</span> means the structured
          model linked this draft to a requirement ID from your grounding bundle.{" "}
          <span className="font-medium text-ink">Missing</span> means the model did not
          claim coverage — not necessarily that the prose is wrong, but evaluators may
          not see an explicit hook.{" "}
          <span className="font-medium text-ink">Limited proof</span> uses the proof graph
          when this bundle includes requirement support; otherwise it falls back to the
          older risk/status heuristic.
        </p>
      </div>

      {!bundle ? (
        <div className="rounded-md border border-dashed border-zinc-300 bg-zinc-50/40 px-3 py-3 text-xs text-ink-muted">
          <p className="font-medium text-ink">No grounding bundle attached</p>
          <p className="mt-1 leading-relaxed">
            Attach a bundle to relate coverage to real requirement titles and evidence.
          </p>
        </div>
      ) : !metadata ? (
        <div className="space-y-3 text-xs text-ink-muted">
          <p>
            Bundle holds {bundle.requirements.length} requirements ·{" "}
            {bundle.evidence.length} evidence items
            {countBundleWeakVerificationEvidence(bundle) > 0
              ? ` · ${countBundleWeakVerificationEvidence(bundle)} with weak verification status`
              : ""}
            .
          </p>
          <div className="rounded-md border border-dashed border-zinc-300 bg-zinc-50/35 px-3 py-2">
            <p className="font-medium text-ink">No structured coverage for this version</p>
            <p className="mt-1 leading-relaxed">
              Generate or save a version so requirement coverage IDs populate from the
              model output.
            </p>
          </div>
        </div>
      ) : analysis ? (
        <>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            <CountPill label="Covered" value={analysis.coveredCount} tone="ok" />
            <CountPill
              label="Missing"
              value={analysis.missingCount}
              tone={analysis.missingCount > 0 ? "warn" : "ok"}
            />
            <CountPill
              label="Limited proof"
              value={analysis.weakSupportCount}
              tone={analysis.weakSupportCount > 0 ? "warn" : "default"}
            />
            <CountPill
              label="Unsupported claims"
              value={analysis.unsupportedClaimCount}
              tone={analysis.unsupportedClaimCount > 0 ? "warn" : "default"}
            />
          </div>

          {analysis.unsupportedClaimCount > 0 ? (
            <p className="rounded-md border border-zinc-200 bg-zinc-50/70 px-2.5 py-2 text-[11px] leading-relaxed text-ink-muted">
              <span className="font-medium text-ink">Unsupported claim flags</span>{" "}
              ({analysis.unsupportedClaimCount}) mark prose the model could not tie to
              grounding-bundle evidence — qualify, cite, or remove before submission.
            </p>
          ) : null}

          {analysis.bundleWeakEvidenceCount > 0 ? (
            <p className="text-[11px] text-ink-subtle">
              Bundle includes {analysis.bundleWeakEvidenceCount} evidence item(s)
              marked Pending or Unverified — coverage may read stronger than underlying
              proof.
            </p>
          ) : null}

          <div className="grid gap-4 border-t border-border/70 pt-4 md:grid-cols-3">
            <ReqList title="Covered requirements" rows={analysis.covered} variant="covered" />
            <ReqList title="Missing coverage" rows={analysis.missing} variant="missing" />
            <ReqList
              title="Limited proof (covered reqs)"
              rows={analysis.weaklySupported}
              variant="weak"
            />
          </div>
        </>
      ) : null}
    </Card>
  );
}
