import { Card } from "@/components/ui/Card";
import { formatRecordDate } from "@/lib/display-format";

type DeadlineCardProps = {
  dueDateIso: string;
};

export function DeadlineCard({ dueDateIso }: DeadlineCardProps) {
  return (
    <Card className="h-full space-y-4">
      <div>
        <h3 className="text-sm font-semibold text-ink">Deadlines</h3>
        <p className="mt-1 text-sm text-ink-muted">
          Primary submission target and internal checkpoints.
        </p>
      </div>
      <div className="rounded-md border border-border bg-zinc-50/60 px-4 py-3">
        <p className="text-xs font-medium uppercase tracking-wider text-ink-subtle">
          Client submission
        </p>
        <p className="mt-1 text-lg font-semibold text-ink">
          {formatRecordDate(dueDateIso)}
        </p>
      </div>
      <ul className="space-y-2 text-sm text-ink-muted">
        <li className="flex justify-between gap-4 border-t border-border pt-3">
          <span>Internal red-team readout</span>
          <span className="shrink-0 text-ink-subtle">TBD</span>
        </li>
        <li className="flex justify-between gap-4">
          <span>Pricing workbook lock</span>
          <span className="shrink-0 text-ink-subtle">TBD</span>
        </li>
      </ul>
    </Card>
  );
}
