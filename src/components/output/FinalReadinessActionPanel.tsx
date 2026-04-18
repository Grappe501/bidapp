import { Card } from "@/components/ui/Card";
import type { FinalReadinessNextAction } from "@/lib/output-utils";

export function FinalReadinessActionPanel({
  actions,
}: {
  actions: FinalReadinessNextAction[];
}) {
  return (
    <div className="space-y-2">
      <h2 className="text-xs font-semibold uppercase tracking-wide text-ink-subtle">
        Next actions to reach ready
      </h2>
      <Card className="p-5">
        <p className="text-xs leading-relaxed text-ink-muted">
          Short, executive-facing list — work top to bottom, then refresh this page.
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
