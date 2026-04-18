import { formatRecordDate, formatVendorDimensionLabel } from "@/lib/display-format";
import { sourceFileCount } from "@/lib/vendor-utils";
import { VendorFitScoreBadge } from "@/components/vendors/VendorFitScoreBadge";
import { VendorTypeBadge } from "@/components/vendors/VendorTypeBadge";
import { Badge } from "@/components/ui/Badge";
import { formatVendorStatusLabel } from "@/lib/display-format";
import type { Vendor } from "@/types";

type VendorDirectoryTableProps = {
  vendors: Vendor[];
  compareVendorIds: string[];
  onToggleCompare: (vendorId: string) => void;
  onOpen: (vendor: Vendor) => void;
};

export function VendorDirectoryTable({
  vendors,
  compareVendorIds,
  onToggleCompare,
  onOpen,
}: VendorDirectoryTableProps) {
  if (vendors.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-border bg-zinc-50/50 px-6 py-12 text-center text-sm text-ink-muted">
        No vendors match the current filters.
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-lg border border-border bg-surface-raised shadow-sm">
      <div className="overflow-x-auto">
        <table className="min-w-[1100px] w-full border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-border bg-zinc-50/80">
              <th className="w-10 px-3 py-3" aria-label="Compare" />
              <th className="px-3 py-3 text-xs font-semibold uppercase tracking-wider text-ink-muted">
                Vendor
              </th>
              <th className="px-3 py-3 text-xs font-semibold uppercase tracking-wider text-ink-muted">
                Category
              </th>
              <th className="px-3 py-3 text-xs font-semibold uppercase tracking-wider text-ink-muted">
                Status
              </th>
              <th className="px-3 py-3 text-xs font-semibold uppercase tracking-wider text-ink-muted">
                Fit
              </th>
              <th className="px-3 py-3 text-xs font-semibold uppercase tracking-wider text-ink-muted">
                Speed
              </th>
              <th className="px-3 py-3 text-xs font-semibold uppercase tracking-wider text-ink-muted">
                API
              </th>
              <th className="px-3 py-3 text-xs font-semibold uppercase tracking-wider text-ink-muted">
                LTC
              </th>
              <th className="px-3 py-3 text-xs font-semibold uppercase tracking-wider text-ink-muted">
                Sources
              </th>
              <th className="px-3 py-3 text-xs font-semibold uppercase tracking-wider text-ink-muted">
                Updated
              </th>
            </tr>
          </thead>
          <tbody>
            {vendors.map((v) => (
              <tr
                key={v.id}
                className="cursor-pointer border-b border-border last:border-b-0 hover:bg-zinc-50/80"
                onClick={() => onOpen(v)}
              >
                <td className="px-3 py-3 align-top" onClick={(e) => e.stopPropagation()}>
                  <input
                    type="checkbox"
                    className="h-4 w-4 rounded border-border"
                    checked={compareVendorIds.includes(v.id)}
                    onChange={() => onToggleCompare(v.id)}
                    aria-label={`Include ${v.name} in comparison`}
                  />
                </td>
                <td className="max-w-[220px] px-3 py-3 align-top">
                  <div className="font-medium text-ink">{v.name}</div>
                  <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-ink-muted">
                    {v.summary}
                  </p>
                </td>
                <td className="whitespace-nowrap px-3 py-3 align-top">
                  <VendorTypeBadge category={v.category} />
                </td>
                <td className="whitespace-nowrap px-3 py-3 align-top">
                  <Badge variant="muted">{formatVendorStatusLabel(v.status)}</Badge>
                </td>
                <td className="whitespace-nowrap px-3 py-3 align-top">
                  <VendorFitScoreBadge score={v.fitScore} />
                </td>
                <td className="whitespace-nowrap px-3 py-3 align-top text-xs text-ink-muted">
                  {formatVendorDimensionLabel(v.implementationSpeed)}
                </td>
                <td className="whitespace-nowrap px-3 py-3 align-top text-xs text-ink-muted">
                  {formatVendorDimensionLabel(v.apiReadiness)}
                </td>
                <td className="whitespace-nowrap px-3 py-3 align-top text-xs text-ink-muted">
                  {formatVendorDimensionLabel(v.ltcFit)}
                </td>
                <td className="whitespace-nowrap px-3 py-3 align-top tabular-nums text-ink-muted">
                  {sourceFileCount(v)}
                </td>
                <td className="whitespace-nowrap px-3 py-3 align-top text-ink-muted">
                  {formatRecordDate(v.updatedAt)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
