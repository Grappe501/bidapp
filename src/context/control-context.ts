import { createContext } from "react";
import type { DiscussionItem, RedactionFlag, SubmissionItem } from "@/types";

export type ControlContextValue = {
  submissionItems: SubmissionItem[];
  discussionItems: DiscussionItem[];
  redactionFlags: RedactionFlag[];
  updateSubmissionItem: (id: string, patch: Partial<SubmissionItem>) => void;
  updateDiscussionItem: (id: string, patch: Partial<DiscussionItem>) => void;
  updateRedactionFlag: (id: string, patch: Partial<RedactionFlag>) => void;
  addRedactionFlag: (draft: Omit<RedactionFlag, "id">) => void;
};

export const ControlContext = createContext<ControlContextValue | null>(null);
