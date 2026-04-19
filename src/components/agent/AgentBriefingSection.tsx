import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { cn } from "@/lib/utils";
import type { AgentMaloneBriefing, AgentMaloneBriefingMode } from "@/types";

const MODES: { id: AgentMaloneBriefingMode; label: string }[] = [
  { id: "default", label: "Default" },
  { id: "executive", label: "Executive" },
  { id: "strategy", label: "Strategy" },
  { id: "vendor", label: "Vendor" },
  { id: "readiness", label: "Readiness" },
  { id: "drafting", label: "Drafting" },
  { id: "pricing", label: "Pricing" },
  { id: "comparison", label: "Comparison" },
];

type Props = {
  briefing: AgentMaloneBriefing | null;
  loading: boolean;
  error: string | null;
  mode: AgentMaloneBriefingMode;
  onModeChange: (mode: AgentMaloneBriefingMode) => void;
  onRefresh: () => void;
  disabled?: boolean;
  onCopyPrompt?: () => void;
};

export function AgentBriefingSection({
  briefing,
  loading,
  error,
  mode,
  onModeChange,
  onRefresh,
  disabled,
  onCopyPrompt,
}: Props) {
  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wide text-ink-muted">
            Operational briefing
          </h2>
          <p className="text-xs text-ink-muted">
            Live bid state — not a chat recap. Modes change emphasis; facts stay
            grounded.
          </p>
        </div>
        <div className="flex flex-wrap gap-1.5">
          <Button
            type="button"
            variant="secondary"
            className="py-1 text-xs"
            disabled={disabled || loading}
            onClick={() => onRefresh()}
          >
            {loading ? "Refreshing…" : "Refresh briefing"}
          </Button>
          {onCopyPrompt ? (
            <Button
              type="button"
              variant="secondary"
              className="py-1 text-xs"
              disabled={disabled || !briefing}
              onClick={onCopyPrompt}
            >
              Copy as prompt
            </Button>
          ) : null}
        </div>
      </div>

      <div className="flex flex-wrap gap-1">
        {MODES.map((m) => (
          <button
            key={m.id}
            type="button"
            disabled={disabled || loading}
            onClick={() => onModeChange(m.id)}
            className={cn(
              "rounded-full border px-2.5 py-0.5 text-[11px] transition-colors",
              mode === m.id
                ? "border-ink bg-zinc-200 font-medium text-ink"
                : "border-border bg-surface-raised text-ink-muted hover:bg-zinc-50",
            )}
          >
            {m.label}
          </button>
        ))}
      </div>

      {error ? (
        <p className="text-xs text-amber-800">{error}</p>
      ) : null}

      {!briefing && loading ? (
        <Card className="border-dashed p-4 text-sm text-ink-muted">
          Loading briefing…
        </Card>
      ) : null}

      {briefing ? (
        <div className="space-y-3">
          <Card className="border-l-4 border-l-zinc-700 bg-zinc-50/90 p-4">
            <p className="text-[10px] font-medium uppercase tracking-wide text-ink-muted">
              {briefing.mode} · confidence {briefing.confidence}
            </p>
            <h3 className="mt-1 text-base font-semibold text-ink">
              {briefing.headline}
            </h3>
            <div className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-ink">
              {briefing.summary}
            </div>
            {briefing.recommendation ? (
              <p className="mt-3 text-xs text-ink">
                <span className="font-medium">Recommendation: </span>
                {briefing.recommendation.label} (
                {briefing.recommendation.confidence}) —{" "}
                {briefing.recommendation.rationale}
              </p>
            ) : null}
            {briefing.readiness ? (
              <p className="mt-2 text-xs text-ink">
                <span className="font-medium">Gate: </span>
                {briefing.readiness.overallState.replace(/_/g, " ")}
              </p>
            ) : null}
          </Card>

          <div className="grid gap-3 md:grid-cols-3">
            <Card className="p-3">
              <p className="text-[10px] font-semibold uppercase text-ink-muted">
                Recent activity
              </p>
              <ul className="mt-2 list-inside list-disc space-y-1 text-[11px] text-ink">
                {briefing.recentChanges.length ? (
                  briefing.recentChanges.map((x, i) => <li key={i}>{x}</li>)
                ) : (
                  <li className="list-none text-ink-muted">
                    No recent workflow lines in this thread.
                  </li>
                )}
              </ul>
            </Card>
            <Card className="p-3">
              <p className="text-[10px] font-semibold uppercase text-ink-muted">
                Open follow-ups
              </p>
              <ul className="mt-2 list-inside list-disc space-y-1 text-[11px] text-ink">
                {briefing.openFollowUps.length ? (
                  briefing.openFollowUps.map((x, i) => <li key={i}>{x}</li>)
                ) : (
                  <li className="list-none text-ink-muted">None flagged.</li>
                )}
              </ul>
            </Card>
            <Card className="p-3">
              <p className="text-[10px] font-semibold uppercase text-ink-muted">
                Next actions
              </p>
              <ul className="mt-2 space-y-1 text-[11px] text-ink">
                {briefing.nextActions.map((a, i) => (
                  <li key={i}>
                    <span className="font-medium">{a.label}</span>
                    <span className="text-ink-muted"> · {a.actionType}</span>
                  </li>
                ))}
              </ul>
            </Card>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <Card className="p-3">
              <p className="text-[10px] font-semibold uppercase text-ink-muted">
                Risks & weaknesses
              </p>
              <ul className="mt-2 space-y-1 text-[11px] text-ink">
                {briefing.topRisks.slice(0, 5).map((x, i) => (
                  <li key={`r-${i}`}>R: {x}</li>
                ))}
                {briefing.topWeaknesses.slice(0, 5).map((x, i) => (
                  <li key={`w-${i}`}>W: {x}</li>
                ))}
              </ul>
            </Card>
            <Card className="p-3">
              <p className="text-[10px] font-semibold uppercase text-ink-muted">
                Strongest signals
              </p>
              <ul className="mt-2 list-inside list-disc space-y-1 text-[11px] text-ink">
                {briefing.strongestSignals.length ? (
                  briefing.strongestSignals.map((x, i) => (
                    <li key={i}>{x}</li>
                  ))
                ) : (
                  <li className="list-none text-ink-muted">—</li>
                )}
              </ul>
              <p className="mt-3 text-[10px] text-ink-muted">
                Evidence:{" "}
                {briefing.evidence.map((e) => e.label).join(" · ").slice(0, 280)}
              </p>
            </Card>
          </div>

          <p className="text-[10px] text-ink-muted">
            Generated {new Date(briefing.generatedAt).toLocaleString()}
          </p>
        </div>
      ) : null}
    </div>
  );
}
