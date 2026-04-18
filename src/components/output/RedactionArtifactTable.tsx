import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import {
  redactionEntitySourcePath,
  redactionJustificationLabel,
  redactionLikelyNeedsRedactedCopy,
} from "@/lib/output-utils";
import type { RedactionFlag } from "@/types";

export function RedactionArtifactTable({
  flags,
  selectedId,
  onSelect,
}: {
  flags: RedactionFlag[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  if (flags.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-border bg-zinc-50/50 px-4 py-8 text-center text-sm text-ink-muted">
        No redaction items on file. Add them from the contract / control workspace when
        materials may require a <span className="font-medium text-ink">redacted packet</span>.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-border">
      <table className="w-full min-w-[900px] text-left text-sm">
        <thead>
          <tr className="border-b border-border bg-zinc-50/90">
            <th className="px-3 py-2.5 text-[10px] font-semibold uppercase tracking-wide text-ink-subtle">
              Redaction item
            </th>
            <th className="px-3 py-2.5 text-[10px] font-semibold uppercase tracking-wide text-ink-subtle">
              Entity type
            </th>
            <th className="px-3 py-2.5 text-[10px] font-semibold uppercase tracking-wide text-ink-subtle">
              Source reference
            </th>
            <th className="px-3 py-2.5 text-[10px] font-semibold uppercase tracking-wide text-ink-subtle">
              Sensitivity / reason
            </th>
            <th className="px-3 py-2.5 text-[10px] font-semibold uppercase tracking-wide text-ink-subtle">
              Status
            </th>
            <th className="px-3 py-2.5 text-[10px] font-semibold uppercase tracking-wide text-ink-subtle">
              Redacted copy likely
            </th>
            <th className="px-3 py-2.5 text-[10px] font-semibold uppercase tracking-wide text-ink-subtle">
              Justification
            </th>
            <th className="px-3 py-2.5 text-[10px] font-semibold uppercase tracking-wide text-ink-subtle">
              Decision
            </th>
          </tr>
        </thead>
        <tbody>
          {flags.map((f) => {
            const ref = redactionEntitySourcePath(f);
            const selected = f.id === selectedId;
            const likely = redactionLikelyNeedsRedactedCopy(f);
            const unresolved = f.status !== "Cleared";
            return (
              <tr
                key={f.id}
                className={cn(
                  "cursor-pointer border-b border-border last:border-0 transition-colors",
                  selected && "bg-zinc-100/80",
                  !selected && "hover:bg-zinc-50/60",
                  unresolved && f.status === "Open" && "bg-amber-50/25",
                )}
                onClick={() => onSelect(f.id)}
              >
                <td className="px-3 py-2.5">
                  <span className="font-medium text-ink">{f.entityLabel}</span>
                </td>
                <td className="px-3 py-2.5 text-xs text-ink-muted">{f.entityType}</td>
                <td className="px-3 py-2.5 text-xs">
                  {ref ? (
                    <Link
                      to={ref.to}
                      className="font-medium text-ink underline-offset-2 hover:underline"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {ref.label}
                    </Link>
                  ) : (
                    "—"
                  )}
                </td>
                <td className="max-w-xs px-3 py-2.5 text-xs leading-relaxed text-ink-muted">
                  {f.reason}
                </td>
                <td className="px-3 py-2.5 text-xs font-medium text-ink">{f.status}</td>
                <td className="px-3 py-2.5 text-xs">
                  {likely ? (
                    <span className="font-medium text-amber-900">Yes</span>
                  ) : (
                    <span className="text-ink-subtle">No</span>
                  )}
                </td>
                <td className="max-w-[200px] px-3 py-2.5 text-[11px] leading-snug text-ink-muted">
                  {redactionJustificationLabel(f)}
                </td>
                <td className="px-3 py-2.5 text-xs font-medium">
                  {unresolved ? (
                    <span className="text-amber-900">Open</span>
                  ) : (
                    <span className="text-emerald-900">Closed</span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
