import { useContext } from "react";
import { SubmissionContext } from "./submission-context";

export function useSubmission() {
  const ctx = useContext(SubmissionContext);
  if (!ctx) {
    throw new Error("useSubmission must be used within SubmissionProvider");
  }
  return ctx;
}
