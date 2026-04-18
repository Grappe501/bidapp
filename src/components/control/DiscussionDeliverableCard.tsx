import { Card } from "@/components/ui/Card";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import { SubmissionStatusBadge } from "@/components/control/SubmissionStatusBadge";
import type { DiscussionItem, SubmissionItemStatus } from "@/types";
import { SUBMISSION_ITEM_STATUSES } from "@/types";

type DiscussionDeliverableCardProps = {
  item: DiscussionItem;
  onChange: (patch: Partial<DiscussionItem>) => void;
};

export function DiscussionDeliverableCard({
  item,
  onChange,
}: DiscussionDeliverableCardProps) {
  return (
    <Card className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <h3 className="font-semibold text-ink">{item.name}</h3>
        <SubmissionStatusBadge status={item.status} />
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block space-y-1.5 sm:col-span-2">
          <span className="text-xs font-medium text-ink-muted">Readiness</span>
          <Select
            value={item.status}
            onChange={(e) =>
              onChange({ status: e.target.value as SubmissionItemStatus })
            }
          >
            {SUBMISSION_ITEM_STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </Select>
        </label>
        <label className="block space-y-1.5 sm:col-span-2">
          <span className="text-xs font-medium text-ink-muted">Notes</span>
          <Textarea
            rows={3}
            value={item.notes}
            onChange={(e) => onChange({ notes: e.target.value })}
          />
        </label>
      </div>
    </Card>
  );
}
