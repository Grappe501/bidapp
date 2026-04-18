import { Link } from "react-router-dom";
import { Card } from "@/components/ui/Card";
import {
  OUTPUT_BUNDLE_WORKSPACE_HREF,
  packagingBlockerCount,
  type BundleSuitabilityRow,
  type OutputSuitability,
} from "@/lib/output-utils";
import type { OutputBundle, PackagingCompleteness } from "@/types";
import { OutputStatusBadge } from "./OutputStatusBadge";

function SuitCell({ label, value }: { label: string; value: OutputSuitability }) {
  const text = value === "ready" ? "Yes" : value === "partial" ? "Partial" : "Not yet";
  const cls =
    value === "ready"
      ? "text-emerald-800"
      : value === "partial"
        ? "text-amber-900"
        : "text-ink-muted";
  return (
    <div className="rounded-md border border-border/70 bg-white px-2 py-1.5 text-center">
      <p className="text-[9px] font-medium uppercase tracking-wide text-ink-subtle">
        {label}
      </p>
      <p className={`mt-0.5 text-[11px] font-semibold ${cls}`}>{text}</p>
    </div>
  );
}

export function OutputBundleCard({
  bundle,
  completeness,
  suitability,
  redactionUnresolved,
}: {
  bundle: OutputBundle;
  completeness?: PackagingCompleteness;
  suitability: BundleSuitabilityRow;
  /** Unresolved redaction items (show when relevant to this bundle). */
  redactionUnresolved: number;
}) {
  const href = OUTPUT_BUNDLE_WORKSPACE_HREF[bundle.bundleType];
  const blockers = completeness ? packagingBlockerCount(completeness) : 0;

  const typeLabel =
    bundle.bundleType === "Submission Package"
      ? "Submission package"
      : bundle.bundleType === "Client Review Packet"
        ? "Client review packet"
        : bundle.bundleType === "Redacted Packet"
          ? "Redacted packet"
          : bundle.bundleType === "Final Readiness Bundle"
            ? "Final readiness bundle"
            : bundle.bundleType;

  return (
    <Card className="flex h-full flex-col gap-3 p-4">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-ink-subtle">
            {typeLabel}
          </p>
          <h3 className="mt-1 text-sm font-semibold leading-snug text-ink">
            {bundle.title}
          </h3>
        </div>
        <OutputStatusBadge status={bundle.status} className="shrink-0" />
      </div>

      <div className="flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-ink-muted">
        <span>
          <span className="text-ink-subtle">Artifacts</span>{" "}
          <span className="font-semibold tabular-nums text-ink">
            {bundle.artifactIds.length}
          </span>
        </span>
        <span>
          <span className="text-ink-subtle">Packaging blockers</span>{" "}
          <span className="font-semibold tabular-nums text-ink">{blockers}</span>
        </span>
        {bundle.bundleType === "Redacted Packet" ? (
          <span>
            <span className="text-ink-subtle">Open redaction items</span>{" "}
            <span className="font-semibold tabular-nums text-ink">
              {redactionUnresolved}
            </span>
          </span>
        ) : null}
      </div>

      {completeness ? (
        <div className="rounded-md border border-border/60 bg-zinc-50/80 px-3 py-2 text-xs text-ink-muted">
          <span className="font-semibold tabular-nums text-ink">
            {completeness.percent}%
          </span>{" "}
          packaged ·{" "}
          {completeness.complete ? (
            <span className="text-emerald-800">thresholds met</span>
          ) : (
            <span className="text-amber-900">gaps remain</span>
          )}
        </div>
      ) : null}

      <div>
        <p className="text-[10px] font-semibold uppercase tracking-wide text-ink-subtle">
          Suitable for (heuristic)
        </p>
        <div className="mt-2 grid grid-cols-3 gap-1.5">
          <SuitCell label="Client review" value={suitability.clientReview} />
          <SuitCell
            label="Submission assembly"
            value={suitability.submissionAssembly}
          />
          <SuitCell
            label="Final decision"
            value={suitability.finalDecisionReview}
          />
        </div>
        <p className="mt-1.5 text-[10px] leading-snug text-ink-subtle">
          Not legal sign-off — from packaging completeness and review gates only.
        </p>
      </div>

      <p className="line-clamp-3 flex-1 text-xs leading-relaxed text-ink-muted">
        {bundle.notes}
      </p>

      <Link
        to={href}
        className="text-xs font-semibold text-ink underline-offset-2 hover:underline"
      >
        Open workspace →
      </Link>
    </Card>
  );
}
