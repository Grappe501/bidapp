import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useOutput } from "@/context/useOutput";
import { useWorkspace } from "@/context/useWorkspace";
import { appendAuditEntry } from "@/server/services/audit.service";
import { runFinalValidationGate } from "@/server/services/submission.service";
import {
  getWorkflowProgressPercent,
  validateStepCompletion,
} from "@/server/services/workflow.service";
import { SubmissionContext, SUBMISSION_PRESET_ACTORS } from "./submission-context";
import type {
  SubmissionAuditLog,
  SubmissionExecutionLog,
  SubmissionTask,
  SubmissionWorkflowStep,
} from "@/types";

const STORAGE_KEY = "bidapp-submission-workflow-v1";

type Persisted = {
  workflowSteps: SubmissionWorkflowStep[];
  tasks: SubmissionTask[];
  auditLog: SubmissionAuditLog[];
  executionLog: SubmissionExecutionLog;
  currentActor: string;
};

function loadPersisted(): Partial<Persisted> | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as Partial<Persisted>;
  } catch {
    return null;
  }
}

function savePersisted(data: Persisted) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    /* ignore */
  }
}

function seedAudit(projectId: string): SubmissionAuditLog[] {
  const t = new Date().toISOString();
  return [
    {
      id: "audit-seed-1",
      projectId,
      actionType: "Other",
      actor: "System",
      entityType: "project",
      entityId: projectId,
      description: "Submission execution workspace initialized (BP-009).",
      createdAt: t,
    },
  ];
}

export function SubmissionProvider({ children }: { children: ReactNode }) {
  const {
    reviewSnapshot,
    reviewIssues,
    artifacts,
    redactionSummary,
  } = useOutput();
  const { project } = useWorkspace();
  const projectId = project.id;

  const p = loadPersisted();

  const [workflowSteps, setWorkflowSteps] = useState<SubmissionWorkflowStep[]>(
    () => (p?.workflowSteps?.length ? p.workflowSteps : []),
  );
  const [tasks, setTasks] = useState<SubmissionTask[]>(() =>
    p?.tasks?.length ? p.tasks : [],
  );
  const [auditLog, setAuditLog] = useState<SubmissionAuditLog[]>(() =>
    p?.auditLog?.length ? p.auditLog : seedAudit(projectId),
  );
  const [executionLog, setExecutionLog] = useState<SubmissionExecutionLog>(() =>
    p?.executionLog ?? {
      projectId,
      finalStatus: "Not submitted",
      submittedAt: null,
      executedBy: "",
      confirmationNotes: "",
    },
  );
  const [currentActor, setCurrentActorState] = useState(
    () => p?.currentActor ?? SUBMISSION_PRESET_ACTORS[0],
  );
  const [lastStepActionMessage, setLastStepActionMessage] = useState<
    string | null
  >(null);

  const finalGate = useMemo(
    () =>
      runFinalValidationGate(
        reviewSnapshot,
        reviewIssues,
        artifacts,
        redactionSummary,
      ),
    [reviewSnapshot, reviewIssues, artifacts, redactionSummary],
  );

  const workflowProgressPercent = useMemo(
    () => getWorkflowProgressPercent(workflowSteps),
    [workflowSteps],
  );

  useEffect(() => {
    savePersisted({
      workflowSteps,
      tasks,
      auditLog,
      executionLog,
      currentActor,
    });
  }, [workflowSteps, tasks, auditLog, executionLog, currentActor]);

  useEffect(() => {
    if (finalGate.status !== "PASS") return;
    setTasks((prev) =>
      prev.map((t) =>
        t.id === "task-005" && t.status === "Blocked"
          ? {
              ...t,
              status: "Not Started",
              notes: "Gate clear — schedule ARBuy execution.",
              updatedAt: new Date().toISOString(),
            }
          : t,
      ),
    );
  }, [finalGate.status]);

  const pushAudit = useCallback(
    (row: {
      actionType: import("@/types").SubmissionAuditActionType;
      entityType: string;
      entityId: string;
      description: string;
    }) => {
      setAuditLog((prev) =>
        appendAuditEntry(prev, {
          projectId,
          actionType: row.actionType,
          actor: currentActor,
          entityType: row.entityType,
          entityId: row.entityId,
          description: row.description,
        }),
      );
    },
    [currentActor, projectId],
  );

  const setCurrentActor = useCallback((a: string) => {
    setCurrentActorState(a);
  }, []);

  const clearStepActionMessage = useCallback(() => {
    setLastStepActionMessage(null);
  }, []);

  const updateWorkflowStep = useCallback(
    (id: string, patch: Partial<import("@/types").SubmissionWorkflowStep>) => {
      const target = workflowSteps.find((s) => s.id === id);
      if (!target) return;

      let completedAt = target.completedAt;
      const nextStatus = patch.status;
      if (nextStatus === "Completed") {
        completedAt = new Date().toISOString();
      } else if (nextStatus !== undefined) {
        completedAt = null;
      }
      const merged: import("@/types").SubmissionWorkflowStep = {
        ...target,
        ...patch,
        completedAt,
      };

      const nextSteps = workflowSteps.map((s) => (s.id === id ? merged : s));

      if (patch.status === "Completed") {
        const check = validateStepCompletion(
          target.orderIndex,
          nextSteps,
          finalGate,
        );
        if (!check.ok) {
          setLastStepActionMessage(check.reason ?? "Cannot complete step.");
          return;
        }
      }

      setWorkflowSteps(nextSteps);
      setLastStepActionMessage(null);

      if (patch.status != null || patch.assignedTo != null) {
        pushAudit({
          actionType: "Workflow step updated",
          entityType: "workflow_step",
          entityId: id,
          description: `Step "${target.stepName}" → ${patch.status ?? target.status}`,
        });
      }

      if (target.stepName === "Final Validation Gate" && patch.status === "Completed") {
        pushAudit({
          actionType: "Final gate evaluated",
          entityType: "workflow_step",
          entityId: id,
          description: `Final validation gate marked complete (${finalGate.status}).`,
        });
      }
    },
    [workflowSteps, finalGate, pushAudit],
  );

  const updateTask = useCallback(
    (id: string, patch: Partial<import("@/types").SubmissionTask>) => {
      setTasks((prev) =>
        prev.map((t) =>
          t.id === id
            ? { ...t, ...patch, updatedAt: new Date().toISOString() }
            : t,
        ),
      );
      if (
        patch.status != null ||
        patch.assignedTo != null ||
        patch.dueAt !== undefined
      ) {
        pushAudit({
          actionType: "Task updated",
          entityType: "submission_task",
          entityId: id,
          description: "Task assignment or status changed.",
        });
      }
    },
    [pushAudit],
  );

  const markSubmissionExecuted = useCallback(
    (confirmationNotes: string) => {
      if (finalGate.status === "FAIL") {
        setLastStepActionMessage("Final gate must PASS before recording submission.");
        return;
      }
      const arbuy = workflowSteps.find((s) => s.stepName === "ARBuy Upload Execution");
      if (!arbuy || arbuy.status !== "Completed") {
        setLastStepActionMessage("Complete ARBuy upload step first.");
        return;
      }
      const t = new Date().toISOString();
      setExecutionLog({
        projectId,
        finalStatus: "Submitted",
        submittedAt: t,
        executedBy: currentActor,
        confirmationNotes,
      });
      setWorkflowSteps((prev) =>
        prev.map((s) =>
          s.stepName === "Submission Confirmation"
            ? {
                ...s,
                status: "Completed",
                completedAt: t,
              }
            : s,
        ),
      );
      pushAudit({
        actionType: "Submission marked complete",
        entityType: "project",
        entityId: projectId,
        description: `Submission recorded by ${currentActor}. ${confirmationNotes.slice(0, 200)}`,
      });
      setLastStepActionMessage(null);
    },
    [finalGate.status, workflowSteps, currentActor, pushAudit, projectId],
  );

  const value = useMemo(
    () => ({
      workflowSteps,
      tasks,
      auditLog,
      executionLog,
      currentActor,
      setCurrentActor,
      finalGate,
      workflowProgressPercent,
      updateWorkflowStep,
      updateTask,
      markSubmissionExecuted,
      lastStepActionMessage,
      clearStepActionMessage,
    }),
    [
      workflowSteps,
      tasks,
      auditLog,
      executionLog,
      currentActor,
      setCurrentActor,
      finalGate,
      workflowProgressPercent,
      updateWorkflowStep,
      updateTask,
      markSubmissionExecuted,
      lastStepActionMessage,
      clearStepActionMessage,
    ],
  );

  return (
    <SubmissionContext.Provider value={value}>{children}</SubmissionContext.Provider>
  );
}
