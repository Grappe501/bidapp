import { Link } from "react-router-dom";
import { OutputStatusBadge } from "@/components/output/OutputStatusBadge";
import {
  OUTPUT_BUNDLE_WORKSPACE_HREF,
  OUTPUT_READINESS_STRIP_TYPES,
  packagingBlockerCount,
} from "@/lib/output-utils";
import type { OutputBundle, OutputBundleType, PackagingCompleteness } from "@/types";

type OutputReadinessStripProps = {
  bundles: OutputBundle[];
  packagingByBundle: Record<string, PackagingCompleteness>;
  redactionUnresolved: number;
  criticalIssueCount: number;
};

export function OutputReadinessStrip({
  bundles,
  packagingByBundle,
  redactionUnresolved,
  criticalIssueCount,
}: OutputReadinessStripProps) {
  const byType = Object.fromEntries(
    bundles.map((b) => [b.bundleType, b]),
  ) as Record<OutputBundleType, OutputBundle | undefined>;

  return (
    <div className="space-y-2">
      <h2 className="text-xs font-semibold uppercase tracking-wide text-ink-subtle">
        Readiness by bundle
      </h2>
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
        {OUTPUT_READINESS_STRIP_TYPES.map((bt) => {
          const b = byType[bt];
          const c = b ? packagingByBundle[b.id] : undefined;
          const blockers = c ? packagingBlockerCount(c) : 0;
          const href = OUTPUT_BUNDLE_WORKSPACE_HREF[bt];
          const extra =
            bt === "Redacted Packet"
              ? `${redactionUnresolved} open redaction item(s)`
              : `${blockers} packaging blocker(s)`;

          return (
            <Link
              key={bt}
              to={href}
              className="group rounded-lg border border-border bg-white px-3 py-3 shadow-sm transition-colors hover:border-zinc-300 hover:bg-zinc-50/50"
            >
              <p className="text-[10px] font-semibold uppercase tracking-wide text-ink-subtle group-hover:text-ink">
                {bt === "Submission Package"
                  ? "Submission package"
                  : bt === "Client Review Packet"
                    ? "Client review packet"
                    : bt === "Redacted Packet"
                      ? "Redacted packet"
                      : "Final readiness bundle"}
              </p>
              {b ? (
                <>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <OutputStatusBadge
                      status={b.status}
                      className="text-[10px] px-1.5 py-0"
                    />
                    {c ? (
                      <span className="text-xs font-semibold tabular-nums text-ink">
                        {c.percent}%
                      </span>
                    ) : null}
                  </div>
                  <p className="mt-1.5 text-[11px] leading-snug text-ink-muted">
                    {c?.complete ? (
                      <span className="text-emerald-800">Complete</span>
                    ) : (
                      <span>Gaps remain</span>
                    )}
                    {" · "}
                    <span className="text-ink-subtle">{extra}</span>
                  </p>
                </>
              ) : (
                <p className="mt-2 text-xs text-ink-muted">No bundle data</p>
              )}
            </Link>
          );
        })}
        <div className="rounded-lg border border-zinc-200 bg-zinc-50/60 px-3 py-3">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-ink-subtle">
            Review gate
          </p>
          <p className="mt-2 text-sm font-semibold tabular-nums text-ink">
            {criticalIssueCount}
            <span className="text-xs font-normal text-ink-muted">
              {" "}
              critical
            </span>
          </p>
          <Link
            to="/review/issues"
            className="mt-2 inline-block text-[11px] font-medium text-ink underline-offset-2 hover:underline"
          >
            Open issues →
          </Link>
        </div>
      </div>
    </div>
  );
}
