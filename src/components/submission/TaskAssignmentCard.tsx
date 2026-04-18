import { Link } from "react-router-dom";
import { Card } from "@/components/ui/Card";
import type { SubmissionTask, TaskStatus } from "@/types";
import { TaskStatusBadge } from "./TaskStatusBadge";
import { SUBMISSION_PRESET_ACTORS } from "@/context/submission-context";

const TASK_STATUSES: TaskStatus[] = [
  "Not Started",
  "In Progress",
  "Completed",
  "Blocked",
];

function entityLink(
  t: SubmissionTask,
): { label: string; to: string } | null {
  switch (t.relatedEntityType) {
    case "draft_section":
      return { label: "Open draft", to: `/drafts/${t.relatedEntityId}` };
    case "submission_item":
      return { label: "Bid control", to: "/control/submission" };
    case "review_issue":
      return {
        label: "Review issue",
        to: `/review/issues/${encodeURIComponent(t.relatedEntityId)}`,
      };
    case "redaction_flag":
      return { label: "Redaction", to: "/output/redaction" };
    case "workflow_step":
      return { label: "Workflow", to: "/submission" };
    default:
      return null;
  }
}

export function TaskAssignmentCard({
  task,
  onChange,
}: {
  task: SubmissionTask;
  onChange: (patch: Partial<SubmissionTask>) => void;
}) {
  const ref = entityLink(task);
  return (
    <Card className="flex flex-col gap-3 p-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <h3 className="text-sm font-medium text-ink">{task.taskName}</h3>
        <TaskStatusBadge status={task.status} />
      </div>
      <div className="grid gap-2 sm:grid-cols-2">
        <label className="text-xs">
          <span className="text-ink-subtle">Assigned to</span>
          <select
            className="mt-1 w-full rounded-md border border-border bg-surface-raised px-2 py-1.5 text-sm"
            value={task.assignedTo}
            onChange={(e) => onChange({ assignedTo: e.target.value })}
          >
            {Array.from(new Set([...SUBMISSION_PRESET_ACTORS, task.assignedTo])).map(
              (a) => (
                <option key={a} value={a}>
                  {a}
                </option>
              ),
            )}
          </select>
        </label>
        <label className="text-xs">
          <span className="text-ink-subtle">Status</span>
          <select
            className="mt-1 w-full rounded-md border border-border bg-surface-raised px-2 py-1.5 text-sm"
            value={task.status}
            onChange={(e) => onChange({ status: e.target.value as TaskStatus })}
          >
            {TASK_STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </label>
        <label className="text-xs sm:col-span-2">
          <span className="text-ink-subtle">Due</span>
          <input
            type="date"
            className="mt-1 w-full rounded-md border border-border bg-surface-raised px-2 py-1.5 text-sm"
            value={task.dueAt ?? ""}
            onChange={(e) =>
              onChange({ dueAt: e.target.value || null })
            }
          />
        </label>
      </div>
      <label className="text-xs">
        <span className="text-ink-subtle">Notes</span>
        <textarea
          className="mt-1 w-full rounded-md border border-border bg-surface-raised px-2 py-1.5 text-sm"
          rows={2}
          value={task.notes}
          onChange={(e) => onChange({ notes: e.target.value })}
        />
      </label>
      <p className="text-[10px] text-ink-subtle">
        Linked: {task.relatedEntityType} · {task.relatedEntityId}
      </p>
      {ref ? (
        <Link
          to={ref.to}
          className="text-xs font-medium text-ink underline-offset-2 hover:underline"
        >
          {ref.label} →
        </Link>
      ) : null}
    </Card>
  );
}
