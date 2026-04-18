import { createContext } from "react";
import type { FinalValidationGateResult } from "@/lib/submission-utils";
import type {
  SubmissionAuditLog,
  SubmissionExecutionLog,
  SubmissionTask,
  SubmissionWorkflowStep,
} from "@/types";

export const SUBMISSION_PRESET_ACTORS = [
  "Proposal lead",
  "Proposal ops",
  "Volume lead",
  "Legal",
  "Compliance",
  "Finance desk",
  "Client executive",
] as const;

export type SubmissionContextValue = {
  workflowSteps: SubmissionWorkflowStep[];
  tasks: SubmissionTask[];
  auditLog: SubmissionAuditLog[];
  executionLog: SubmissionExecutionLog;
  currentActor: string;
  setCurrentActor: (a: string) => void;
  finalGate: FinalValidationGateResult;
  workflowProgressPercent: number;
  updateWorkflowStep: (id: string, patch: Partial<SubmissionWorkflowStep>) => void;
  updateTask: (id: string, patch: Partial<SubmissionTask>) => void;
  markSubmissionExecuted: (confirmationNotes: string) => void;
  lastStepActionMessage: string | null;
  clearStepActionMessage: () => void;
};

export const SubmissionContext = createContext<SubmissionContextValue | null>(
  null,
);
