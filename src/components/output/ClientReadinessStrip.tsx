import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import type { ReadinessScore } from "@/types";

function Bar({ label, value }: { label: string; value: number }) {
  return (
    <div className="min-w-0 flex-1">
      <div className="flex items-baseline justify-between gap-2">
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
            "h-full rounded-full bg-zinc-800/90 transition-[width]",
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

export function ClientReadinessStrip({ readiness }: { readiness: ReadinessScore }) {
  return (
    <div className="rounded-lg border border-border bg-white px-5 py-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wide text-ink-subtle">
            Readiness snapshot
          </p>
          <p className="mt-1 text-sm text-ink-muted">
            Composite model across submission, coverage, grounding, and contract posture —
            not a raw data dump.
          </p>
        </div>
        <Link
          to="/review/readiness"
          className="shrink-0 text-xs font-semibold text-ink underline-offset-2 hover:underline"
        >
          Full readiness model →
        </Link>
      </div>
      <div className="mt-5 flex flex-col gap-4 sm:flex-row sm:items-stretch">
        <Bar label="Overall" value={readiness.overall} />
        <Bar label="Submission" value={readiness.submission} />
        <Bar label="Coverage" value={readiness.coverage} />
        <Bar label="Grounding" value={readiness.grounding} />
        <Bar label="Contract" value={readiness.contract_readiness} />
        <Bar label="Scoring fit" value={readiness.scoring_alignment} />
      </div>
    </div>
  );
}
