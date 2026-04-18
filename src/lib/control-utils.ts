import type {
  RedactionFlag,
  RedactionFlagStatus,
  SubmissionItem,
  SubmissionItemStatus,
} from "@/types";

const DONE_SUBMISSION: SubmissionItemStatus[] = ["Validated", "Submitted"];

export function submissionRequiredCompleteCount(items: SubmissionItem[]): number {
  const required = items.filter((i) => i.required);
  return required.filter((i) => DONE_SUBMISSION.includes(i.status)).length;
}

export function submissionRequiredTotal(items: SubmissionItem[]): number {
  return items.filter((i) => i.required).length;
}

export function isSubmissionItemValidated(item: SubmissionItem): boolean {
  return item.status === "Validated" || item.status === "Submitted";
}

export function filterRedactionFlagsByStatus(
  flags: RedactionFlag[],
  status: RedactionFlagStatus | "all",
): RedactionFlag[] {
  if (status === "all") return flags;
  return flags.filter((f) => f.status === status);
}

export function openRedactionCount(flags: RedactionFlag[]): number {
  return flags.filter((f) => f.status === "Open").length;
}
