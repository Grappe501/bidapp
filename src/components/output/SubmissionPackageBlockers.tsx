import { Link } from "react-router-dom";
import { Card } from "@/components/ui/Card";
import type { SubmissionPackageBlockerLine } from "@/lib/output-utils";

export function SubmissionPackageBlockers({
  blockers,
}: {
  blockers: SubmissionPackageBlockerLine[];
}) {
  if (blockers.length === 0) {
    return (
      <Card className="border-emerald-200/70 bg-emerald-50/30 p-4">
        <p className="text-sm font-medium text-emerald-950/90">
          No submission blockers on this snapshot
        </p>
        <p className="mt-1 text-xs leading-relaxed text-emerald-950/85">
          Required solicitation items are linked and meet the packaging
          threshold, and no open redaction items block handoff. Continue
          executive and legal review as usual.
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-2">
      <h2 className="text-xs font-semibold uppercase tracking-wide text-ink-subtle">
        Submission blockers
      </h2>
      <Card className="divide-y divide-border/70 p-0">
        <div className="px-4 py-3">
          <p className="text-[11px] leading-relaxed text-ink-muted">
            Highest-impact items that prevent treating the{" "}
            <span className="font-medium text-ink">submission package</span> as
            production-complete. Resolve in order of dependency (missing links
            first, then packaging validation, then redaction).
          </p>
        </div>
        <ul className="divide-y divide-border/60">
          {blockers.map((b) => (
            <li key={b.id} className="px-4 py-3 text-sm">
              <p className="font-medium text-ink">{b.title}</p>
              <p className="mt-1 text-xs leading-relaxed text-ink-muted">
                {b.detail}
              </p>
              {b.to ? (
                <Link
                  to={b.to}
                  className="mt-2 inline-block text-xs font-medium text-ink underline-offset-2 hover:underline"
                >
                  Open source workspace →
                </Link>
              ) : null}
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}
