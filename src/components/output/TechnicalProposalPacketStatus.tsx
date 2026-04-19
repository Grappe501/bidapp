import { Card } from "@/components/ui/Card";
import { cn } from "@/lib/utils";
import type { TechnicalProposalPacketCompliance } from "@/types";

export function TechnicalProposalPacketStatus({
  compliance,
  compact = false,
}: {
  compliance: TechnicalProposalPacketCompliance | null;
  compact?: boolean;
}) {
  if (!compliance?.applicable) {
    return null;
  }

  const ok = compliance.readyForPacketAssembly;
  const row = (label: string, pass: boolean) => (
    <div className="flex items-center justify-between gap-3 text-xs">
      <span className="text-ink-muted">{label}</span>
      <span
        className={cn(
          "font-medium",
          pass ? "text-emerald-900" : "text-amber-900",
        )}
      >
        {pass ? "Yes" : "No"}
      </span>
    </div>
  );

  return (
    <Card
      className={cn(
        "border p-4",
        ok ? "border-emerald-200/80 bg-emerald-50/20" : "border-amber-200/80 bg-amber-50/25",
      )}
    >
      <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-ink-subtle">
        Technical Proposal Packet (S000000479)
      </p>
      <p className="mt-1 text-sm font-semibold text-ink">
        {ok
          ? "Structurally aligned for packet assembly"
          : "Packet format gaps — resolve before submission"}
      </p>
      {!compact && (
        <p className="mt-1 text-xs text-ink-muted">
          State packet blueprint drives drafting constraints, checklist, and page limits for Experience,
          Solution, and Risk.
        </p>
      )}
      <div className="mt-3 space-y-2 border-t border-border/60 pt-3">
        {row("Structured model loaded", compliance.structuredModelLoaded)}
        {row("Drafting constraints active", compliance.draftingConstraintsActive)}
        {row("Core packet checklist complete", compliance.coreChecklistComplete)}
        {row("Page limits (E/S/R)", compliance.pageLimitsCompliant)}
        {row("No external links in scored volumes", compliance.noExternalLinksInScoredVolumes)}
        {row("Ready for packet assembly", compliance.readyForPacketAssembly)}
      </div>
      {compliance.issues.length > 0 && (
        <ul className="mt-3 list-inside list-disc space-y-1 text-xs text-ink-muted">
          {compliance.issues.slice(0, 6).map((x, i) => (
            <li key={i}>{x}</li>
          ))}
        </ul>
      )}
    </Card>
  );
}
