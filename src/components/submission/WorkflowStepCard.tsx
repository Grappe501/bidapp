import { Card } from "@/components/ui/Card";
import type { SubmissionWorkflowStep, SubmissionWorkflowStatus } from "@/types";
import { WorkflowStatusBadge } from "./WorkflowStatusBadge";
import { SUBMISSION_PRESET_ACTORS } from "@/context/submission-context";

const STATUSES: SubmissionWorkflowStatus[] = [
  "Not Started",
  "In Progress",
  "Ready",
  "Blocked",
  "Completed",
];

export function WorkflowStepCard({
  step,
  onChange,
  blockHint,
}: {
  step: SubmissionWorkflowStep;
  onChange: (patch: Partial<SubmissionWorkflowStep>) => void;
  blockHint?: string | null;
}) {
  return (
    <Card className="flex flex-col gap-3 p-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="text-[10px] font-medium uppercase tracking-wide text-ink-subtle">
            Step {step.orderIndex + 1}
          </p>
          <h3 className="text-sm font-semibold text-ink">{step.stepName}</h3>
        </div>
        <WorkflowStatusBadge status={step.status} />
      </div>
      <p className="text-xs leading-relaxed text-ink-muted">{step.description}</p>

      <div className="grid gap-2 sm:grid-cols-2">
        <label className="block text-xs">
          <span className="text-ink-subtle">Owner</span>
          <select
            className="mt-1 w-full rounded-md border border-border bg-surface-raised px-2 py-1.5 text-sm text-ink"
            value={step.assignedTo}
            onChange={(e) => onChange({ assignedTo: e.target.value })}
          >
            {Array.from(
              new Set([...SUBMISSION_PRESET_ACTORS, step.assignedTo]),
            ).map((a) => (
              <option key={a} value={a}>
                {a}
              </option>
            ))}
          </select>
        </label>
        <label className="block text-xs">
          <span className="text-ink-subtle">Status</span>
          <select
            className="mt-1 w-full rounded-md border border-border bg-surface-raised px-2 py-1.5 text-sm text-ink"
            value={step.status}
            onChange={(e) =>
              onChange({ status: e.target.value as SubmissionWorkflowStatus })
            }
          >
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </label>
      </div>

      <label className="block text-xs">
        <span className="text-ink-subtle">Notes</span>
        <textarea
          className="mt-1 w-full rounded-md border border-border bg-surface-raised px-2 py-1.5 text-sm text-ink"
          rows={2}
          value={step.notes}
          onChange={(e) => onChange({ notes: e.target.value })}
        />
      </label>

      {step.completedAt ? (
        <p className="text-[10px] text-ink-subtle">
          Completed {new Date(step.completedAt).toLocaleString()}
        </p>
      ) : null}
      {blockHint ? (
        <p className="text-xs text-amber-900">{blockHint}</p>
      ) : null}
    </Card>
  );
}
