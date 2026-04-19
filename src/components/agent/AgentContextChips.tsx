import type { AgentMaloneThreadSummary } from "@/types";

export function AgentContextChips({
  summary,
}: {
  summary: AgentMaloneThreadSummary | null;
}) {
  if (!summary) return null;
  const chips: { label: string; value?: string }[] = [
    { label: "Vendor", value: summary.currentVendorId },
    { label: "Architecture", value: summary.currentArchitectureOptionId },
    { label: "Focus", value: summary.currentFocus },
  ];
  const visible = chips.filter((c) => c.value);
  if (visible.length === 0) return null;
  return (
    <div className="flex flex-wrap gap-1.5">
      {visible.map((c) => (
        <span
          key={c.label}
          className="rounded-full border border-border bg-zinc-50 px-2 py-0.5 text-[11px] text-ink"
        >
          <span className="font-medium text-ink-muted">{c.label}: </span>
          <span className="font-mono text-[10px]">{c.value}</span>
        </span>
      ))}
    </div>
  );
}
