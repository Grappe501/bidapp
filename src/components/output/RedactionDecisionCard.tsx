import { Link } from "react-router-dom";
import { Card } from "@/components/ui/Card";
import {
  redactionEntitySourcePath,
  redactionJustificationLabel,
  redactionLikelyNeedsRedactedCopy,
} from "@/lib/output-utils";
import type { RedactionFlag } from "@/types";
import { OutputStatusBadge } from "./OutputStatusBadge";
import type { OutputStatus } from "@/types";

function flagToOutputStatus(s: RedactionFlag["status"]): OutputStatus {
  if (s === "Cleared") return "Validated";
  if (s === "Under Review") return "In Progress";
  return "Draft";
}

export function RedactionDecisionCard({
  flag,
}: {
  flag: RedactionFlag | null;
}) {
  if (!flag) {
    return (
      <Card className="border-dashed border-border bg-zinc-50/40 p-6">
        <p className="text-sm font-medium text-ink">Redaction item detail</p>
        <p className="mt-2 text-sm text-ink-muted">
          Select a row in the control table to review sensitivity, justification status,
          and whether this item belongs in the{" "}
          <span className="font-medium text-ink">redacted copy workflow</span>.
        </p>
      </Card>
    );
  }

  const ref = redactionEntitySourcePath(flag);
  const needsRedacted = redactionLikelyNeedsRedactedCopy(flag);
  const unresolved = flag.status !== "Cleared";

  return (
    <Card className="overflow-hidden p-0">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-border bg-zinc-50/80 px-5 py-4">
        <div className="min-w-0">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-ink-subtle">
            Redaction item · decision context
          </p>
          <h2 className="mt-1 break-words text-base font-semibold text-ink">
            {flag.entityLabel}
          </h2>
          <p className="mt-1 text-xs text-ink-muted">
            Entity type: <span className="font-medium text-ink">{flag.entityType}</span>
          </p>
        </div>
        <OutputStatusBadge status={flagToOutputStatus(flag.status)} />
      </div>
      <div className="space-y-4 px-5 py-4 text-sm">
        <section>
          <h3 className="text-[10px] font-semibold uppercase tracking-wide text-ink-subtle">
            Why flagged (sensitivity)
          </h3>
          <p className="mt-2 leading-relaxed text-ink-muted">{flag.reason}</p>
        </section>
        <section>
          <h3 className="text-[10px] font-semibold uppercase tracking-wide text-ink-subtle">
            Justification / disposition
          </h3>
          <p className="mt-2 leading-relaxed text-ink">{redactionJustificationLabel(flag)}</p>
        </section>
        <section className="rounded-md border border-border/80 bg-white px-3 py-3 text-xs">
          <dl className="grid gap-2 sm:grid-cols-2">
            <div>
              <dt className="text-ink-subtle">Redaction status</dt>
              <dd className="mt-0.5 font-medium text-ink">{flag.status}</dd>
            </div>
            <div>
              <dt className="text-ink-subtle">Unresolved decision</dt>
              <dd className="mt-0.5 font-medium text-ink">
                {unresolved ? "Yes — disposition required" : "No — cleared"}
              </dd>
            </div>
            <div className="sm:col-span-2">
              <dt className="text-ink-subtle">Redacted copy workflow</dt>
              <dd className="mt-0.5 font-medium text-ink">
                {needsRedacted
                  ? "Treat as in-scope for redacted packet — confirm legal judgment before inclusion."
                  : "Cleared — may be represented as released or non-sensitive in public materials."}
              </dd>
            </div>
          </dl>
        </section>
        <div className="flex flex-wrap gap-3">
          {ref ? (
            <Link
              to={ref.to}
              className="text-xs font-semibold text-ink underline-offset-2 hover:underline"
            >
              {ref.label} →
            </Link>
          ) : null}
          <Link
            to="/control/contract"
            className="text-xs font-semibold text-ink underline-offset-2 hover:underline"
          >
            Update status in control center →
          </Link>
        </div>
      </div>
    </Card>
  );
}
