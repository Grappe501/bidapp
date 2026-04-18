import { Badge } from "@/components/ui/Badge";
import { formatRecordDate, formatEvidenceValidationLabel } from "@/lib/display-format";
import { EvidenceTypeBadge } from "@/components/evidence/EvidenceTypeBadge";
import type { EvidenceItem } from "@/types";

type EvidenceExplorerTableProps = {
  items: EvidenceItem[];
  linkedRequirementCount: (evidenceId: string) => number;
  onOpen: (item: EvidenceItem) => void;
};

export function EvidenceExplorerTable({
  items,
  linkedRequirementCount,
  onOpen,
}: EvidenceExplorerTableProps) {
  if (items.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-border bg-zinc-50/50 px-6 py-12 text-center">
        <p className="text-sm font-medium text-ink">No evidence matches</p>
        <p className="mt-1 text-sm text-ink-muted">
          Adjust filters or broaden search.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-lg border border-border bg-surface-raised shadow-sm">
      <div className="overflow-x-auto">
        <table className="min-w-[960px] w-full border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-border bg-zinc-50/80">
              <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-ink-muted">
                Title
              </th>
              <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-ink-muted">
                Type
              </th>
              <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-ink-muted">
                Validation
              </th>
              <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-ink-muted">
                Source
              </th>
              <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-ink-muted">
                Section
              </th>
              <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-ink-muted">
                Excerpt
              </th>
              <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-ink-muted">
                Reqs
              </th>
              <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-ink-muted">
                Updated
              </th>
            </tr>
          </thead>
          <tbody>
            {items.map((e) => (
              <tr
                key={e.id}
                className="cursor-pointer border-b border-border last:border-b-0 hover:bg-zinc-50/80"
                onClick={() => onOpen(e)}
              >
                <td className="max-w-[220px] px-4 py-3 align-top">
                  <span className="font-medium text-ink">{e.title}</span>
                </td>
                <td className="whitespace-nowrap px-4 py-3 align-top">
                  <EvidenceTypeBadge type={e.evidenceType} />
                </td>
                <td className="whitespace-nowrap px-4 py-3 align-top">
                  <Badge variant="muted">
                    {formatEvidenceValidationLabel(e.validationStatus)}
                  </Badge>
                </td>
                <td className="max-w-[140px] px-4 py-3 align-top text-xs text-ink-muted">
                  <span className="line-clamp-2 break-words">
                    {e.sourceFileName}
                  </span>
                </td>
                <td className="max-w-[120px] px-4 py-3 align-top text-xs text-ink-muted">
                  {e.sourceSection}
                </td>
                <td className="max-w-[260px] px-4 py-3 align-top">
                  <span className="line-clamp-2 text-xs leading-relaxed text-ink-muted">
                    {e.excerpt}
                  </span>
                </td>
                <td className="whitespace-nowrap px-4 py-3 align-top tabular-nums text-ink-muted">
                  {linkedRequirementCount(e.id)}
                </td>
                <td className="whitespace-nowrap px-4 py-3 align-top text-ink-muted">
                  {formatRecordDate(e.updatedAt)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
