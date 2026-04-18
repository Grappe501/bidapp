import { SubmissionAuditTable } from "@/components/submission/SubmissionAuditTable";
import { SubmissionLogCard } from "@/components/submission/SubmissionLogCard";
import { SubmissionSubNav } from "@/components/submission/SubmissionSubNav";
import { Card } from "@/components/ui/Card";
import { useSubmission } from "@/context/useSubmission";

export function SubmissionAuditPage() {
  const { auditLog, executionLog } = useSubmission();

  const byAction = auditLog.reduce<Record<string, number>>((acc, l) => {
    acc[l.actionType] = (acc[l.actionType] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <div className="p-8">
      <div className="mx-auto max-w-6xl space-y-8">
        <SubmissionSubNav />

        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-ink">
            Audit & submission history
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-ink-muted">
            Traceability for workflow moves, tasks, and final execution — newest
            entries first.
          </p>
        </div>

        <SubmissionLogCard log={executionLog} />

        <Card className="p-4">
          <h2 className="text-sm font-semibold text-ink">Activity summary</h2>
          <ul className="mt-3 flex flex-wrap gap-3 text-xs text-ink-muted">
            {Object.entries(byAction).map(([k, v]) => (
              <li key={k}>
                <span className="font-medium text-ink">{k}</span>: {v}
              </li>
            ))}
          </ul>
        </Card>

        <div>
          <h2 className="text-sm font-semibold text-ink">Audit log</h2>
          <div className="mt-3">
            <SubmissionAuditTable logs={auditLog} />
          </div>
        </div>
      </div>
    </div>
  );
}
