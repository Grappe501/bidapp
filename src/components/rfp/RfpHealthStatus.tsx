import { cn } from "@/lib/utils";
import type { RfpHealthStatus as RfpHealth } from "@/types/rfp-model";

function Row({ ok, label }: { ok: boolean; label: string }) {
  return (
    <div className="flex items-center justify-between gap-3 text-xs">
      <span className="text-ink-muted">{label}</span>
      <span
        className={cn(
          "font-medium tabular-nums",
          ok ? "text-emerald-800" : "text-amber-900",
        )}
        aria-label={ok ? "Complete" : "Incomplete"}
      >
        {ok ? "✓" : "✗"}
      </span>
    </div>
  );
}

export function RfpHealthStatus({ health }: { health: RfpHealth }) {
  return (
    <div className="rounded-lg border border-zinc-200/90 bg-white/90 px-3 py-2.5">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-ink-subtle">
        RFP status
      </p>
      <div className="mt-2 space-y-1.5">
        <Row ok={health.parsed} label="Parsed (solicitation artifacts)" />
        <Row ok={health.structured} label="Structured (weights & core)" />
        <Row ok={health.requirementsExtracted} label="Requirements extracted" />
        <Row ok={health.submissionDocsComplete} label="Submission docs complete" />
        <Row ok={health.readyForDrafting} label="Ready for drafting" />
      </div>
    </div>
  );
}
