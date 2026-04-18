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

/** Compact preview row for quick scanning alongside the control table. */
export function RedactionPreviewCard({
  flag,
  compact,
}: {
  flag: RedactionFlag;
  compact?: boolean;
}) {
  const ref = redactionEntitySourcePath(flag);
  const needsRedacted = redactionLikelyNeedsRedactedCopy(flag);

  if (compact) {
    return (
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-border/70 bg-white px-3 py-2 text-xs">
        <span className="font-medium text-ink">{flag.entityLabel}</span>
        <span className="text-ink-muted">{flag.status}</span>
      </div>
    );
  }

  return (
    <Card className="p-4">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-ink-subtle">
            {flag.entityType}
          </p>
          <h3 className="mt-0.5 break-words text-sm font-semibold text-ink">
            {flag.entityLabel}
          </h3>
        </div>
        <OutputStatusBadge status={flagToOutputStatus(flag.status)} />
      </div>
      <p className="mt-3 text-xs leading-relaxed text-ink-muted">{flag.reason}</p>
      <div className="mt-4 space-y-2 rounded-md border border-border/60 bg-zinc-50/50 px-3 py-2.5 text-xs text-ink-muted">
        <p>
          <span className="font-medium text-ink">Justification:</span>{" "}
          {redactionJustificationLabel(flag)}
        </p>
        <p>
          <span className="font-medium text-ink">Redacted copy workflow:</span>{" "}
          {needsRedacted
            ? "In scope — confirm disposition before public or FOIA release."
            : "Cleared for packaging narrative."}
        </p>
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
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
          Control center →
        </Link>
      </div>
    </Card>
  );
}
