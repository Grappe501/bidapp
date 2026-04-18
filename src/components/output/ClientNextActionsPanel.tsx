import { Card } from "@/components/ui/Card";
import type { ClientNextAction } from "@/lib/client-review-utils";

export function ClientNextActionsPanel({
  actions,
}: {
  actions: ClientNextAction[];
}) {
  return (
    <div className="space-y-2">
      <h2 className="text-xs font-semibold uppercase tracking-wide text-ink-subtle">
        Next actions
      </h2>
      <Card className="p-5">
        <p className="text-xs leading-relaxed text-ink-muted">
          Practical follow-ups for the client or internal sponsor after this readout.
        </p>
        <ol className="mt-4 list-decimal space-y-2 pl-4 text-sm leading-snug text-ink">
          {actions.map((a) => (
            <li key={a.id}>{a.label}</li>
          ))}
        </ol>
      </Card>
    </div>
  );
}
