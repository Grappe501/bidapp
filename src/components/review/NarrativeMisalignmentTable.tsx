import type { NarrativeMisalignment } from "@/types";

const SEV_CLASS: Record<NarrativeMisalignment["severity"], string> = {
  low: "text-zinc-600",
  medium: "text-amber-900",
  high: "text-orange-950",
  critical: "text-rose-950",
};

export function NarrativeMisalignmentTable(props: {
  items: NarrativeMisalignment[];
  title?: string;
  emptyLabel?: string;
}) {
  const { items, title = "Issues & guidance", emptyLabel = "No items in this list." } = props;
  if (items.length === 0) {
    return (
      <p className="text-xs text-ink-muted">{emptyLabel}</p>
    );
  }
  return (
    <div className="overflow-x-auto">
      <p className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-ink-subtle">
        {title}
      </p>
      <table className="w-full border-collapse text-left text-[11px]">
        <thead>
          <tr className="border-b border-border text-ink-subtle">
            <th className="py-1.5 pr-2 font-medium">Section</th>
            <th className="py-1.5 pr-2 font-medium">Severity</th>
            <th className="py-1.5 pr-2 font-medium">Issue</th>
            <th className="py-1.5 font-medium">Guidance</th>
          </tr>
        </thead>
        <tbody>
          {items.map((m, i) => (
            <tr key={i} className="border-b border-border/70 align-top">
              <td className="py-2 pr-2 font-medium text-ink">{m.sectionKey.replace(/_/g, " ")}</td>
              <td className={`py-2 pr-2 capitalize ${SEV_CLASS[m.severity]}`}>{m.severity}</td>
              <td className="py-2 pr-2 text-ink">{m.message}</td>
              <td className="py-2 text-ink-muted">{m.correctionGuidance}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
