import type { SubmissionWorkflowStep } from "../../types";
import {
  canCompleteWorkflowStep,
  workflowProgressPercent,
  type FinalValidationGateResult,
} from "../../lib/submission-utils";

export function initWorkflowSteps(
  seed: SubmissionWorkflowStep[],
): SubmissionWorkflowStep[] {
  return seed.map((s) => ({ ...s }));
}

export function validateStepCompletion(
  stepOrderIndex: number,
  steps: SubmissionWorkflowStep[],
  gate: FinalValidationGateResult,
) {
  return canCompleteWorkflowStep(stepOrderIndex, steps, gate);
}

export function getWorkflowProgressPercent(steps: SubmissionWorkflowStep[]) {
  return workflowProgressPercent(steps);
}
