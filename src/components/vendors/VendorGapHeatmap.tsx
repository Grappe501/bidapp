import type { CompetitorHeatmapMatrix, HeatmapCellStatus } from "@/types";

const CELL: Record<
  HeatmapCellStatus,
  { label: string; className: string }
> = {
  met: { label: "Met", className: "bg-emerald-100 text-emerald-900" },
  partial: {
    label: "Partial",
    className: "bg-amber-100 text-amber-900",
  },
  gap: { label: "Gap", className: "bg-rose-100 text-rose-900" },
  unknown: { label: "Unknown", className: "bg-slate-100 text-slate-600" },
};

type VendorGapHeatmapProps = {
  matrix: CompetitorHeatmapMatrix;
  vendorNames: Record<string, string>;
};

export function VendorGapHeatmap({ matrix, vendorNames }: VendorGapHeatmapProps) {
  const vendorIds = matrix.rows[0]
    ? Object.keys(matrix.rows[0].cells)
    : [];

  if (matrix.rows.length === 0 || vendorIds.length === 0) {
    return (
      <p className="text-sm text-ink-muted">
        No heatmap rows — run comparison with vendors that have intelligence data.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-border bg-surface-raised">
      <table className="w-full border-collapse text-left text-xs">
        <thead>
          <tr className="border-b border-border bg-zinc-50/90">
            <th className="sticky left-0 z-10 min-w-[160px] bg-zinc-50/95 px-3 py-2 font-semibold text-ink-muted">
              Theme
            </th>
            {vendorIds.map((id) => (
              <th key={id} className="min-w-[100px] px-2 py-2 font-semibold text-ink-muted">
                {vendorNames[id] ?? id.slice(0, 8)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {matrix.rows.map((row) => (
            <tr key={row.id} className="border-b border-border last:border-b-0">
              <th className="sticky left-0 z-10 bg-surface-raised px-3 py-2 text-left font-medium text-ink">
                {row.label}
              </th>
              {vendorIds.map((vid) => {
                const status = row.cells[vid] ?? "unknown";
                const c = CELL[status];
                return (
                  <td key={vid} className="px-2 py-2 align-middle">
                    <span
                      className={`inline-block rounded px-2 py-0.5 font-medium ${c.className}`}
                    >
                      {c.label}
                    </span>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
      <p className="border-t border-border px-3 py-2 text-[10px] text-ink-muted">
        Cells use keyword + evidence heuristics on ingested text — unknown is honest when
        the theme is not mentioned.
      </p>
    </div>
  );
}
