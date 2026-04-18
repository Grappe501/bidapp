import { Link } from "react-router-dom";
import { Card } from "@/components/ui/Card";
import type { FinalReadinessBlockerLine } from "@/lib/output-utils";

export function FinalBlockerList({
  blockers,
}: {
  blockers: FinalReadinessBlockerLine[];
}) {
  if (blockers.length === 0) {
    return (
      <Card className="border-emerald-200/60 bg-emerald-50/25 p-5">
        <p className="text-sm font-medium text-emerald-950/90">Critical blockers</p>
        <p className="mt-2 text-sm leading-relaxed text-emerald-950/85">
          No top-priority <span className="font-medium">blockers</span> on this snapshot.
          Continue final legal review and manual assembly discipline.
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-2">
      <h2 className="text-xs font-semibold uppercase tracking-wide text-ink-subtle">
        Critical blockers & top remaining risks
      </h2>
      <p className="max-w-3xl text-xs leading-relaxed text-ink-muted">
        Highest-impact issues before a confident{" "}
        <span className="font-medium text-ink">final decision</span>. Calm, operational
        wording — not an alarm wall.
      </p>
      <Card className="divide-y divide-border/70 p-0">
        {blockers.map((b) => (
          <div key={b.id} className="px-5 py-4">
            <p className="text-sm font-medium text-ink">{b.title}</p>
            <p className="mt-1.5 text-xs leading-relaxed text-ink-muted">{b.detail}</p>
            {b.to ? (
              <Link
                to={b.to}
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
