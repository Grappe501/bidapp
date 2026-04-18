import type { ReactNode } from "react";
import { formatVendorDimensionLabel } from "@/lib/display-format";
import { topStrings } from "@/lib/vendor-utils";
import { VendorFitScoreBadge } from "@/components/vendors/VendorFitScoreBadge";
import { VendorTypeBadge } from "@/components/vendors/VendorTypeBadge";
import { Badge } from "@/components/ui/Badge";
import { formatVendorStatusLabel } from "@/lib/display-format";
import type { Vendor } from "@/types";

const ROWS: { key: string; label: string; render: (v: Vendor) => ReactNode }[] =
  [
    {
      key: "category",
      label: "Category",
      render: (v) => <VendorTypeBadge category={v.category} />,
    },
    {
      key: "status",
      label: "Status",
      render: (v) => (
        <Badge variant="muted">{formatVendorStatusLabel(v.status)}</Badge>
      ),
    },
    {
      key: "fit",
      label: "Fit score",
      render: (v) => <VendorFitScoreBadge score={v.fitScore} />,
    },
    {
      key: "speed",
      label: "Implementation speed",
      render: (v) => formatVendorDimensionLabel(v.implementationSpeed),
    },
    {
      key: "api",
      label: "API readiness",
      render: (v) => formatVendorDimensionLabel(v.apiReadiness),
    },
    {
      key: "ltc",
      label: "LTC fit",
      render: (v) => formatVendorDimensionLabel(v.ltcFit),
    },
    {
      key: "pricing",
      label: "Pricing notes",
      render: (v) => (
        <span className="text-xs leading-relaxed text-ink-muted">{v.pricingNotes}</span>
      ),
    },
    {
      key: "strengths",
      label: "Top strengths",
      render: (v) => (
        <ul className="list-inside list-disc space-y-1 text-xs text-ink-muted">
          {topStrings(v.strengths, 3).map((s, i) => (
            <li key={i}>{s}</li>
          ))}
        </ul>
      ),
    },
    {
      key: "weaknesses",
      label: "Top weaknesses",
      render: (v) => (
        <ul className="list-inside list-disc space-y-1 text-xs text-ink-muted">
          {topStrings(v.weaknesses, 3).map((s, i) => (
            <li key={i}>{s}</li>
          ))}
        </ul>
      ),
    },
    {
      key: "risks",
      label: "Major risks",
      render: (v) => (
        <ul className="space-y-1 text-xs text-ink-muted">
          {topStrings(v.risks, 3).map((s, i) => (
            <li key={i} className="border-l-2 border-amber-200/80 pl-2">
              {s}
            </li>
          ))}
        </ul>
      ),
    },
    {
      key: "role",
      label: "Likely stack role",
      render: (v) => (
        <span className="text-xs leading-relaxed text-ink">{v.likelyStackRole}</span>
      ),
    },
  ];

type VendorComparisonTableProps = {
  vendors: Vendor[];
};

export function VendorComparisonTable({ vendors }: VendorComparisonTableProps) {
  if (vendors.length === 0) {
    return (
      <p className="text-sm text-ink-muted">
        Select vendors from the directory to compare.
      </p>
    );
  }

  return (
    <div className="space-y-8 lg:space-y-0">
      <div className="hidden lg:block">
        <div
          className="overflow-x-auto rounded-lg border border-border bg-surface-raised shadow-sm"
          style={{
            minWidth: `${200 + vendors.length * 220}px`,
          }}
        >
          <table className="w-full border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-border bg-zinc-50/80">
                <th className="sticky left-0 z-10 min-w-[180px] bg-zinc-50/95 px-4 py-3 text-xs font-semibold uppercase tracking-wider text-ink-muted">
                  Criterion
                </th>
                {vendors.map((v) => (
                  <th
                    key={v.id}
                    className="min-w-[200px] px-4 py-3 text-xs font-semibold uppercase tracking-wider text-ink-muted"
                  >
                    {v.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {ROWS.map((row) => (
                <tr key={row.key} className="border-b border-border last:border-b-0">
                  <th className="sticky left-0 z-10 bg-surface-raised px-4 py-3 text-left text-xs font-medium text-ink-muted">
                    {row.label}
                  </th>
                  {vendors.map((v) => (
                    <td key={v.id} className="align-top px-4 py-3">
                      {row.render(v)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="space-y-4 lg:hidden">
        {vendors.map((v) => (
          <div
            key={v.id}
            className="rounded-lg border border-border bg-surface-raised p-4 shadow-sm"
          >
            <h3 className="text-base font-semibold text-ink">{v.name}</h3>
            <dl className="mt-3 space-y-3">
              {ROWS.map((row) => (
                <div key={row.key}>
                  <dt className="text-xs font-medium uppercase tracking-wider text-ink-subtle">
                    {row.label}
                  </dt>
                  <dd className="mt-1">{row.render(v)}</dd>
                </div>
              ))}
            </dl>
          </div>
        ))}
      </div>
    </div>
  );
}
