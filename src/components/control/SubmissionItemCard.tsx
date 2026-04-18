import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import { SubmissionStatusBadge } from "@/components/control/SubmissionStatusBadge";
import { Badge } from "@/components/ui/Badge";
import type { SubmissionItem, SubmissionItemStatus } from "@/types";
import { SUBMISSION_ITEM_STATUSES } from "@/types";

type SubmissionItemCardProps = {
  item: SubmissionItem;
  onChange: (patch: Partial<SubmissionItem>) => void;
};

export function SubmissionItemCard({ item, onChange }: SubmissionItemCardProps) {
  const validated = item.status === "Validated" || item.status === "Submitted";

  return (
    <Card className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-semibold text-ink">{item.name}</h3>
            {item.required ? (
              <Badge variant="emphasis" className="text-[10px] uppercase">
                Required
              </Badge>
            ) : (
              <Badge variant="muted">Optional</Badge>
            )}
            <Badge variant="neutral" className="font-normal">
              {item.phase}
            </Badge>
          </div>
          <p className="mt-2 text-xs text-ink-subtle">
            Owner: <span className="text-ink-muted">{item.owner}</span>
          </p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <SubmissionStatusBadge status={item.status} />
          {validated ? (
            <span className="text-[11px] font-medium text-emerald-800">
              Validation-ready track
            </span>
          ) : null}
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block space-y-1.5">
          <span className="text-xs font-medium text-ink-muted">Status</span>
          <Select
            value={item.status}
            onChange={(e) =>
              onChange({ status: e.target.value as SubmissionItemStatus })
            }
            aria-label={`Status for ${item.name}`}
          >
            {SUBMISSION_ITEM_STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </Select>
        </label>
        <label className="block space-y-1.5">
          <span className="text-xs font-medium text-ink-muted">Owner</span>
          <Input
            value={item.owner}
            onChange={(e) => onChange({ owner: e.target.value })}
            aria-label={`Owner for ${item.name}`}
          />
        </label>
      </div>
      <label className="block space-y-1.5">
        <span className="text-xs font-medium text-ink-muted">Notes</span>
        <Textarea
          rows={2}
          value={item.notes}
          onChange={(e) => onChange({ notes: e.target.value })}
        />
      </label>
    </Card>
  );
}
