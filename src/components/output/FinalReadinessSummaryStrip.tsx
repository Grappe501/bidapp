import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import type { ReadinessScore } from "@/types";

function Bar({
  label,
  value,
  narrow,
}: {
  label: string;
  value: number;
  narrow?: boolean;
}) {
  return (
    <div className={cn("min-w-0 flex-1", narrow && "basis-[100px]")}>
      <div className="flex items-baseline justify-between gap-1">
        <span className="truncate text-[10px] font-medium uppercase tracking-wide text-ink-subtle">
          {label}
        </span>
        <span className="shrink-0 text-xs font-semibold tabular-nums text-ink">
          {value}
        </span>
      </div>
      <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-zinc-200/90">
        <div
          className={cn(
            "h-full rounded-full bg-zinc-800/90",
            value >= 80 && "bg-emerald-700/90",
            value >= 60 && value < 80 && "bg-zinc-700/90",
            value < 60 && "bg-amber-700/85",
          )}
          style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
        />
      </div>
    </div>
  );
}

export function FinalReadinessSummaryStrip({
  readiness,
  redactionReadiness,
}: {
  readiness: ReadinessScore;
  /** 0–100 derived from redaction packaging posture */
  redactionReadiness: number;
}) {
  return (
    <div className="rounded-lg border border-border bg-white px-5 py-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wide text-ink-subtle">
            Final readiness summary
          </p>
          <p className="mt-1 text-sm text-ink-muted">
            Composite <span className="font-medium text-ink">readiness</span> dimensions
            plus <span className="font-medium text-ink">redaction readiness</span> for this
            decision snapshot.
          </p>
        </div>
        <Link
          to="/review/readiness"
          className="shrink-0 text-xs font-semibold text-ink underline-offset-2 hover:underline"
        >
          Readiness model →
        </Link>
      </div>
      <div className="mt-5 flex flex-col gap-3 xl:flex-row xl:items-stretch">
        <div className="flex min-w-[120px] flex-col justify-center rounded-md border border-border/80 bg-zinc-50/50 px-3 py-2">
          <p className="text-[10px] font-medium uppercase text-ink-subtle">Overall</p>
          <p className="text-2xl font-semibold tabular-nums text-ink">
            {readiness.overall}
          </p>
        </div>
        <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:flex-wrap">
          <Bar label="Submission" value={readiness.submission} />
          <Bar label="Coverage" value={readiness.coverage} />
          <Bar label="Grounding" value={readiness.grounding} />
          <Bar label="Scoring fit" value={readiness.scoring_alignment} />
          <Bar label="Contract" value={readiness.contract_readiness} />
          <Bar label="Discussion" value={readiness.discussion_readiness} />
          <Bar label="Redaction" value={redactionReadiness} narrow />
        </div>
      </div>
    </div>
  );
}
