import { Card } from "@/components/ui/Card";
import type { SubmissionExecutionLog } from "@/types";

export function SubmissionLogCard({ log }: { log: SubmissionExecutionLog }) {
  return (
    <Card className="p-5">
      <h2 className="text-sm font-semibold text-ink">Submission execution log</h2>
      <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
        <div>
          <dt className="text-xs text-ink-subtle">Final status</dt>
          <dd className="font-medium text-ink">{log.finalStatus}</dd>
        </div>
        <div>
          <dt className="text-xs text-ink-subtle">Submitted at</dt>
          <dd className="text-ink-muted">
            {log.submittedAt
              ? new Date(log.submittedAt).toLocaleString()
              : "—"}
          </dd>
        </div>
        <div>
          <dt className="text-xs text-ink-subtle">Executed by</dt>
          <dd className="text-ink-muted">{log.executedBy || "—"}</dd>
        </div>
        <div className="sm:col-span-2">
          <dt className="text-xs text-ink-subtle">Confirmation notes</dt>
          <dd className="mt-1 whitespace-pre-wrap text-ink-muted">
            {log.confirmationNotes || "—"}
          </dd>
        </div>
      </dl>
    </Card>
  );
}
