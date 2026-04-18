import { Link } from "react-router-dom";
import { Card } from "@/components/ui/Card";
import type { OutputBundle, PackagingCompleteness } from "@/types";
import { OutputStatusBadge } from "./OutputStatusBadge";

const bundleHref: Record<string, string> = {
  "Submission Package": "/output/submission",
  "Client Review Packet": "/output/client-review",
  "Redacted Packet": "/output/redaction",
  "Final Readiness Bundle": "/output/final-bundle",
  "Discussion Packet": "/control/discussion",
};

export function OutputBundleCard({
  bundle,
  completeness,
}: {
  bundle: OutputBundle;
  completeness?: PackagingCompleteness;
}) {
  const href = bundleHref[bundle.bundleType] ?? "/output";

  return (
    <Card className="flex flex-col gap-3 p-4">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-ink-subtle">
            {bundle.bundleType}
          </p>
          <h3 className="mt-1 text-sm font-semibold text-ink">{bundle.title}</h3>
        </div>
        <OutputStatusBadge status={bundle.status} />
      </div>
      {completeness ? (
        <div className="rounded-md bg-zinc-50 px-3 py-2 text-xs text-ink-muted">
          <span className="font-medium tabular-nums text-ink">
            {completeness.percent}%
          </span>{" "}
          packaged ·{" "}
          {completeness.complete ? (
            <span className="text-emerald-800">complete</span>
          ) : (
            <span>gaps remain</span>
          )}
        </div>
      ) : null}
      <p className="text-xs leading-relaxed text-ink-muted">{bundle.notes}</p>
      <Link
        to={href}
        className="text-xs font-medium text-ink underline-offset-2 hover:underline"
      >
        Open workspace →
      </Link>
    </Card>
  );
}
