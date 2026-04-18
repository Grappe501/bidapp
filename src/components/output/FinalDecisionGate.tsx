import { Card } from "@/components/ui/Card";
import { cn } from "@/lib/utils";
import type { FinalDecisionGate as FinalDecisionGateModel } from "@/lib/output-utils";

export function FinalDecisionGate({ gate }: { gate: FinalDecisionGateModel }) {
  const tone =
    gate.state === "ready_submission_assembly"
      ? "success"
      : gate.state === "ready_client_signoff"
        ? "positive"
        : gate.state === "blocked"
          ? "blocked"
          : "neutral";

  return (
    <Card
      className={cn(
        "overflow-hidden p-0 ring-1 ring-inset",
        tone === "success" && "ring-emerald-300/50 bg-emerald-50/25",
        tone === "positive" && "ring-emerald-200/70 bg-emerald-50/15",
        tone === "blocked" && "ring-zinc-400/50 bg-zinc-50/90",
        tone === "neutral" && "ring-amber-200/60 bg-amber-50/20",
      )}
    >
      <div className="border-b border-border/60 px-5 py-4">
        <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-ink-subtle">
          Final decision · go / no-go
        </p>
        <p className="mt-3 text-lg font-semibold leading-snug text-ink">{gate.headline}</p>
        <p className="mt-2 max-w-3xl text-sm leading-relaxed text-ink-muted">
          {gate.subline}
        </p>
      </div>
      <div className="grid gap-px bg-border/80 sm:grid-cols-2 lg:grid-cols-4">
        <GatePill
          label="Blocked"
          active={gate.state === "blocked"}
          hint="Critical findings open"
        />
        <GatePill
          label="Not ready"
          active={gate.state === "not_ready"}
          hint="Packaging / readiness in motion"
        />
        <GatePill
          label="Client sign-off"
          active={gate.state === "ready_client_signoff"}
          hint="Executive approval gate"
        />
        <GatePill
          label="Submission assembly"
          active={gate.state === "ready_submission_assembly"}
          hint="Final packaging gate"
        />
      </div>
    </Card>
  );
}

function GatePill({
  label,
  active,
  hint,
}: {
  label: string;
  active: boolean;
  hint: string;
}) {
  return (
    <div
      className={cn(
        "bg-white px-4 py-3",
        active && "bg-zinc-100/90 ring-1 ring-inset ring-zinc-300/60",
      )}
    >
      <p
        className={cn(
          "text-xs font-semibold",
          active ? "text-ink" : "text-ink-subtle",
        )}
      >
        {label}
      </p>
      <p className="mt-1 text-[10px] leading-snug text-ink-muted">{hint}</p>
    </div>
  );
}
