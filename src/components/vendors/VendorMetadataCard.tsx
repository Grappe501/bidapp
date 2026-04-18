import { Card } from "@/components/ui/Card";
import { formatRecordDate, formatVendorDimensionLabel, formatVendorStatusLabel } from "@/lib/display-format";
import { VendorFitScoreBadge } from "@/components/vendors/VendorFitScoreBadge";
import { VendorTypeBadge } from "@/components/vendors/VendorTypeBadge";
import { Badge } from "@/components/ui/Badge";
import type { Vendor } from "@/types";

export function VendorMetadataCard({ vendor }: { vendor: Vendor }) {
  return (
    <Card className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-xs font-semibold uppercase tracking-wider text-ink-subtle">
            Vendor
          </h2>
          <p className="mt-1 text-xl font-semibold tracking-tight text-ink">
            {vendor.name}
          </p>
        </div>
        <Badge variant="neutral">{formatVendorStatusLabel(vendor.status)}</Badge>
      </div>

      <dl className="grid gap-4 sm:grid-cols-2">
        <div>
          <dt className="text-xs font-medium uppercase tracking-wider text-ink-subtle">
            Category
          </dt>
          <dd className="mt-1">
            <VendorTypeBadge category={vendor.category} />
          </dd>
        </div>
        <div>
          <dt className="text-xs font-medium uppercase tracking-wider text-ink-subtle">
            Fit score
          </dt>
          <dd className="mt-1">
            <VendorFitScoreBadge score={vendor.fitScore} />
          </dd>
        </div>
        <div>
          <dt className="text-xs font-medium uppercase tracking-wider text-ink-subtle">
            Implementation speed
          </dt>
          <dd className="mt-1 text-sm text-ink">
            {formatVendorDimensionLabel(vendor.implementationSpeed)}
          </dd>
        </div>
        <div>
          <dt className="text-xs font-medium uppercase tracking-wider text-ink-subtle">
            API readiness
          </dt>
          <dd className="mt-1 text-sm text-ink">
            {formatVendorDimensionLabel(vendor.apiReadiness)}
          </dd>
        </div>
        <div>
          <dt className="text-xs font-medium uppercase tracking-wider text-ink-subtle">
            LTC fit
          </dt>
          <dd className="mt-1 text-sm text-ink">
            {formatVendorDimensionLabel(vendor.ltcFit)}
          </dd>
        </div>
        <div>
          <dt className="text-xs font-medium uppercase tracking-wider text-ink-subtle">
            Likely stack role
          </dt>
          <dd className="mt-1 text-sm leading-snug text-ink">
            {vendor.likelyStackRole}
          </dd>
        </div>
        <div className="sm:col-span-2">
          <dt className="text-xs font-medium uppercase tracking-wider text-ink-subtle">
            Primary contact
          </dt>
          <dd className="mt-1 text-sm text-ink">
            {vendor.primaryContactName}
            <br />
            <span className="text-ink-muted">{vendor.primaryContactEmail}</span>
            <br />
            <span className="text-ink-muted">{vendor.primaryContactPhone}</span>
          </dd>
        </div>
        <div>
          <dt className="text-xs font-medium uppercase tracking-wider text-ink-subtle">
            Updated
          </dt>
          <dd className="mt-1 text-sm text-ink">
            {formatRecordDate(vendor.updatedAt)}
          </dd>
        </div>
      </dl>
    </Card>
  );
}
