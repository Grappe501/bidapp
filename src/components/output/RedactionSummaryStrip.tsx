import { Card } from "@/components/ui/Card";
import { cn } from "@/lib/utils";
import type { RedactionPackagingSummary } from "@/types";

function supportLabel(s: RedactionPackagingSummary["redactedPacketSupport"]): {
  text: string;
  tone: "ok" | "warn" | "bad";
} {
  switch (s) {
    case "ready":
      return { text: "Redacted packet support is ready", tone: "ok" };
    case "attention_needed":
      return {
        text: "Attention — redacted copy posture needs validation",
        tone: "warn",
      };
    case "blocked":
      return {
        text: "Blocked — unresolved redaction items remain",
        tone: "bad",
      };
    default:
      return { text: "—", tone: "warn" };
  }
}

export function RedactionSummaryStrip({
  summary,
}: {
  summary: RedactionPackagingSummary;
}) {
  const support = supportLabel(summary.redactedPacketSupport);

  return (
    <Card className="overflow-hidden border-zinc-200/90 p-0 shadow-sm">
      <div className="border-b border-border bg-gradient-to-b from-zinc-50/95 to-white px-5 py-4">
        <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-ink-subtle">
          Redacted packet · summary
        </p>
        <p
          className={cn(
            "mt-2 text-sm font-medium",
            support.tone === "ok" && "text-emerald-900",
            support.tone === "warn" && "text-amber-950/90",
            support.tone === "bad" && "text-ink",
          )}
        >
          {support.text}
        </p>
        <p className="mt-1 max-w-3xl text-xs leading-relaxed text-ink-muted">
          This workspace tracks <span className="font-medium text-ink">redaction items</span>{" "}
          for the <span className="font-medium text-ink">redacted packet</span>. It does not
          perform file redaction — it supports decisions and packaging readiness only.
        </p>
      </div>
      <div className="grid gap-px bg-border sm:grid-cols-2 lg:grid-cols-5">
        <Stat label="Total redaction items" value={summary.totalFlagged} />
        <Stat
          label="Unresolved items"
          value={summary.unresolvedCount}
          emphasize={summary.unresolvedCount > 0}
        />
        <Stat label="Awaiting decision (Open)" value={summary.awaitingDecisionCount} />
        <Stat label="In review" value={summary.inReviewCount} />
        <Stat
          label="Ready for redacted packet inclusion"
          value={summary.clearedCount}
          sub="Cleared dispositions"
        />
      </div>
    </Card>
  );
}

function Stat({
  label,
  value,
  sub,
  emphasize,
}: {
  label: string;
  value: number;
  sub?: string;
  emphasize?: boolean;
}) {
  return (
    <div className="bg-white px-4 py-3">
      <p className="text-[10px] font-medium uppercase tracking-wide text-ink-subtle">
        {label}
      </p>
      <p
        className={cn(
          "mt-1 text-2xl font-semibold tabular-nums text-ink",
          emphasize && "text-amber-900",
        )}
      >
        {value}
      </p>
      {sub ? <p className="mt-0.5 text-[10px] text-ink-subtle">{sub}</p> : null}
    </div>
  );
}
