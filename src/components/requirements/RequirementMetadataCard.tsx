import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { formatRecordDate } from "@/lib/display-format";
import { RequirementRiskBadge } from "@/components/requirements/RequirementRiskBadge";
import { RequirementStatusBadge } from "@/components/requirements/RequirementStatusBadge";
import { RequirementTagBadge } from "@/components/control/RequirementTagBadge";
import type { Requirement } from "@/types";

export function RequirementMetadataCard({ req }: { req: Requirement }) {
  return (
    <Card className="space-y-6">
      <div>
        <h2 className="text-xs font-semibold uppercase tracking-wider text-ink-subtle">
          Requirement
        </h2>
        <p className="mt-1 text-lg font-semibold leading-snug text-ink">
          {req.title}
        </p>
      </div>

      <dl className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <dt className="text-xs font-medium uppercase tracking-wider text-ink-subtle">
            Operational tags
          </dt>
          <dd className="mt-1 flex flex-wrap gap-1">
            {req.tags.map((t) => (
              <RequirementTagBadge key={t} tag={t} />
            ))}
          </dd>
        </div>
        <div>
          <dt className="text-xs font-medium uppercase tracking-wider text-ink-subtle">
            Type
          </dt>
          <dd className="mt-1">
            <Badge variant="neutral">{req.requirementType}</Badge>
          </dd>
        </div>
        <div>
          <dt className="text-xs font-medium uppercase tracking-wider text-ink-subtle">
            Mandatory
          </dt>
          <dd className="mt-1">
            <Badge variant={req.mandatory ? "emphasis" : "muted"}>
              {req.mandatory ? "Yes" : "No"}
            </Badge>
          </dd>
        </div>
        <div>
          <dt className="text-xs font-medium uppercase tracking-wider text-ink-subtle">
            Response category
          </dt>
          <dd className="mt-1">
            <Badge variant="muted">{req.responseCategory}</Badge>
          </dd>
        </div>
        <div>
          <dt className="text-xs font-medium uppercase tracking-wider text-ink-subtle">
            Status
          </dt>
          <dd className="mt-1">
            <RequirementStatusBadge status={req.status} />
          </dd>
        </div>
        <div>
          <dt className="text-xs font-medium uppercase tracking-wider text-ink-subtle">
            Risk
          </dt>
          <dd className="mt-1">
            <RequirementRiskBadge risk={req.riskLevel} />
          </dd>
        </div>
        <div>
          <dt className="text-xs font-medium uppercase tracking-wider text-ink-subtle">
            Owner
          </dt>
          <dd className="mt-1 text-sm text-ink">{req.owner}</dd>
        </div>
        <div>
          <dt className="text-xs font-medium uppercase tracking-wider text-ink-subtle">
            Created
          </dt>
          <dd className="mt-1 text-sm text-ink">
            {formatRecordDate(req.createdAt)}
          </dd>
        </div>
        <div>
          <dt className="text-xs font-medium uppercase tracking-wider text-ink-subtle">
            Updated
          </dt>
          <dd className="mt-1 text-sm text-ink">
            {formatRecordDate(req.updatedAt)}
          </dd>
        </div>
      </dl>
    </Card>
  );
}
