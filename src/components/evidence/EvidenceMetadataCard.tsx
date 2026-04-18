import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { formatRecordDate, formatEvidenceValidationLabel } from "@/lib/display-format";
import { EvidenceTypeBadge } from "@/components/evidence/EvidenceTypeBadge";
import type { EvidenceItem } from "@/types";

export function EvidenceMetadataCard({ item }: { item: EvidenceItem }) {
  return (
    <Card className="space-y-6">
      <div>
        <h2 className="text-xs font-semibold uppercase tracking-wider text-ink-subtle">
          Evidence
        </h2>
        <p className="mt-1 text-lg font-semibold leading-snug text-ink">
          {item.title}
        </p>
      </div>

      <dl className="grid gap-4 sm:grid-cols-2">
        <div>
          <dt className="text-xs font-medium uppercase tracking-wider text-ink-subtle">
            Type
          </dt>
          <dd className="mt-1">
            <EvidenceTypeBadge type={item.evidenceType} />
          </dd>
        </div>
        <div>
          <dt className="text-xs font-medium uppercase tracking-wider text-ink-subtle">
            Validation
          </dt>
          <dd className="mt-1">
            <Badge variant="muted">
              {formatEvidenceValidationLabel(item.validationStatus)}
            </Badge>
          </dd>
        </div>
        <div>
          <dt className="text-xs font-medium uppercase tracking-wider text-ink-subtle">
            Created
          </dt>
          <dd className="mt-1 text-sm text-ink">
            {formatRecordDate(item.createdAt)}
          </dd>
        </div>
        <div>
          <dt className="text-xs font-medium uppercase tracking-wider text-ink-subtle">
            Updated
          </dt>
          <dd className="mt-1 text-sm text-ink">
            {formatRecordDate(item.updatedAt)}
          </dd>
        </div>
      </dl>
    </Card>
  );
}
