import { Link } from "react-router-dom";
import { Card } from "@/components/ui/Card";
import type { UnresolvedDecision } from "@/lib/client-review-utils";

export function ClientDecisionPanel({
  decisions,
}: {
  decisions: UnresolvedDecision[];
}) {
  if (decisions.length === 0) {
    return (
      <Card className="border-emerald-200/60 bg-emerald-50/25 p-5">
        <p className="text-sm font-medium text-emerald-950/90">Key unresolved decisions</p>
        <p className="mt-2 text-sm leading-relaxed text-emerald-950/85">
          No material decision queue on this snapshot — submission items are validated or
          review findings are lower priority. Still confirm pricing and disclosure
          posture before external distribution.
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-2">
      <h2 className="text-xs font-semibold uppercase tracking-wide text-ink-subtle">
        Key unresolved decisions
      </h2>
      <p className="max-w-3xl text-xs leading-relaxed text-ink-muted">
        Calm decision list for the client or executive sponsor — not alarmist, but
        explicit about what must be settled before the response is credible.
      </p>
      <Card className="divide-y divide-border/70 p-0">
        {decisions.map((d) => (
          <div key={d.id} className="px-5 py-4">
            <p className="text-sm font-medium text-ink">{d.title}</p>
            <p className="mt-1.5 text-xs leading-relaxed text-ink-muted">{d.detail}</p>
            {d.to ? (
              <Link
                to={d.to}
                className="mt-2 inline-block text-xs font-semibold text-ink underline-offset-2 hover:underline"
              >
                Open related workspace →
              </Link>
            ) : null}
          </div>
        ))}
      </Card>
    </div>
  );
}
