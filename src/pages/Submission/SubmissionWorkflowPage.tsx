import { useState } from "react";
import { FinalExportPanel } from "@/components/submission/FinalExportPanel";
import { SubmissionChecklistStep } from "@/components/submission/SubmissionChecklistStep";
import { SubmissionGateCard } from "@/components/submission/SubmissionGateCard";
import { SubmissionSubNav } from "@/components/submission/SubmissionSubNav";
import { TaskAssignmentCard } from "@/components/submission/TaskAssignmentCard";
import { WorkflowStepCard } from "@/components/submission/WorkflowStepCard";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { SUBMISSION_PRESET_ACTORS } from "@/context/submission-context";
import { useSubmission } from "@/context/useSubmission";
import { useOutput } from "@/context/useOutput";
import { validateStepCompletion } from "@/server/services/workflow.service";

export function SubmissionWorkflowPage() {
  const [confirmNotes, setConfirmNotes] = useState("");
  const {
    workflowSteps,
    tasks,
    finalGate,
    workflowProgressPercent,
    updateWorkflowStep,
    updateTask,
    executionLog,
    markSubmissionExecuted,
    currentActor,
    setCurrentActor,
    lastStepActionMessage,
    clearStepActionMessage,
  } = useSubmission();

  const { readiness, reviewIssues, artifacts, reviewSnapshot } = useOutput();

  const sorted = [...workflowSteps].sort((a, b) => a.orderIndex - b.orderIndex);

  const req = reviewSnapshot.submissionItems.filter(
    (s) => s.required && s.phase === "Proposal",
  );
  const checklistComplete = req.every((s) =>
    ["Ready", "Validated", "Submitted"].includes(s.status),
  );

  const criticalOpen = reviewIssues.filter(
    (i) =>
      i.severity === "Critical" &&
      (i.status === "Open" || i.status === "In Review"),
  ).length;

  const missingArtifacts = artifacts.filter(
    (a) => a.requiredForSubmission && !a.isValidated,
  ).length;

  return (
    <div className="p-8">
      <div className="mx-auto max-w-5xl space-y-8">
        <SubmissionSubNav />

        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-ink">
              Submission workflow
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-ink-muted">
              Mission control from final review through ARBuy execution — gated,
              traceable, and manual by design.
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs text-ink-subtle">Workflow progress</p>
            <p className="text-2xl font-semibold tabular-nums text-ink">
              {workflowProgressPercent}%
            </p>
          </div>
        </div>

        <Card className="p-4">
          <label className="text-xs font-medium text-ink-subtle">
            Acting as
            <select
              className="mt-1 block w-full max-w-xs rounded-md border border-border bg-surface-raised px-2 py-1.5 text-sm"
              value={currentActor}
              onChange={(e) => setCurrentActor(e.target.value)}
            >
              {SUBMISSION_PRESET_ACTORS.map((a) => (
                <option key={a} value={a}>
                  {a}
                </option>
              ))}
            </select>
          </label>
        </Card>

        <SubmissionGateCard
          gate={finalGate}
          readiness={readiness}
          checklistComplete={checklistComplete}
          criticalOpenCount={criticalOpen}
          missingArtifactsCount={missingArtifacts}
          redactionUnresolved={reviewSnapshot.redactionFlags.filter(
            (f) => f.status !== "Cleared",
          ).length}
        />

        <div className="grid gap-2 sm:grid-cols-2">
          <SubmissionChecklistStep
            label="Required submission items"
            ok={checklistComplete}
            detail={`${req.filter((s) => ["Ready", "Validated", "Submitted"].includes(s.status)).length}/${req.length} ready`}
          />
          <SubmissionChecklistStep
            label="Critical review issues cleared"
            ok={criticalOpen === 0}
            detail={criticalOpen ? `${criticalOpen} open` : "None open"}
          />
          <SubmissionChecklistStep
            label="Required artifacts validated"
            ok={missingArtifacts === 0}
            detail={
              missingArtifacts ? `${missingArtifacts} remaining` : "Aligned"
            }
          />
          <SubmissionChecklistStep
            label="Redaction posture"
            ok={
              reviewSnapshot.redactionFlags.filter((f) => f.status !== "Cleared")
                .length === 0
            }
            detail="Flags must be cleared for PASS"
          />
        </div>

        {lastStepActionMessage ? (
          <Card className="border-amber-200/80 bg-amber-50/40 p-4">
            <p className="text-xs text-ink">{lastStepActionMessage}</p>
            <button
              type="button"
              className="mt-2 text-xs text-ink-muted underline"
              onClick={clearStepActionMessage}
            >
              Dismiss
            </button>
          </Card>
        ) : null}

        <div>
          <h2 className="text-sm font-semibold text-ink">Workflow steps</h2>
          <div className="mt-3 grid gap-3 lg:grid-cols-2">
            {sorted.map((step) => {
              const check =
                step.status !== "Completed"
                  ? validateStepCompletion(
                      step.orderIndex,
                      workflowSteps,
                      finalGate,
                    )
                  : { ok: true as const };
              return (
                <WorkflowStepCard
                  key={step.id}
                  step={step}
                  onChange={(patch) => updateWorkflowStep(step.id, patch)}
                  blockHint={check.ok ? null : check.reason}
                />
              );
            })}
          </div>
        </div>

        <div>
          <h2 className="text-sm font-semibold text-ink">Tasks</h2>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            {tasks.map((t) => (
              <TaskAssignmentCard
                key={t.id}
                task={t}
                onChange={(patch) => updateTask(t.id, patch)}
              />
            ))}
          </div>
        </div>

        <FinalExportPanel />

        <Card className="p-5">
          <h2 className="text-sm font-semibold text-ink">Record submission</h2>
          <p className="mt-1 text-xs text-ink-muted">
            After ARBuy confirmation, capture notes here. Requires gate PASS and
            ARBuy step completed.
          </p>
          <textarea
            className="mt-3 w-full rounded-md border border-border bg-surface-raised px-3 py-2 text-sm"
            rows={3}
            placeholder="Confirmation ID, timestamp, receipt notes…"
            value={confirmNotes}
            onChange={(e) => setConfirmNotes(e.target.value)}
          />
          <Button
            type="button"
            className="mt-3"
            onClick={() => markSubmissionExecuted(confirmNotes)}
          >
            Mark submission complete
          </Button>
          {executionLog.finalStatus === "Submitted" ? (
            <p className="mt-3 text-xs text-emerald-800">
              Logged {executionLog.submittedAt ? new Date(executionLog.submittedAt).toLocaleString() : ""}{" "}
              by {executionLog.executedBy}.
            </p>
          ) : null}
        </Card>
      </div>
    </div>
  );
}
