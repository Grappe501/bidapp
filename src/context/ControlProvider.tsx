import {
  useCallback,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { MOCK_DISCUSSION_ITEMS } from "@/data/mockDiscussionItems";
import { MOCK_REDACTION_FLAGS } from "@/data/mockRedactionFlags";
import { MOCK_SUBMISSION_ITEMS } from "@/data/mockSubmissionItems";
import type { DiscussionItem, RedactionFlag, SubmissionItem } from "@/types";
import { ControlContext } from "./control-context";

export function ControlProvider({ children }: { children: ReactNode }) {
  const [submissionItems, setSubmissionItems] = useState<SubmissionItem[]>(() => [
    ...MOCK_SUBMISSION_ITEMS,
  ]);
  const [discussionItems, setDiscussionItems] = useState<DiscussionItem[]>(() => [
    ...MOCK_DISCUSSION_ITEMS,
  ]);
  const [redactionFlags, setRedactionFlags] = useState<RedactionFlag[]>(() => [
    ...MOCK_REDACTION_FLAGS,
  ]);

  const updateSubmissionItem = useCallback(
    (id: string, patch: Partial<SubmissionItem>) => {
      setSubmissionItems((prev) =>
        prev.map((s) => (s.id === id ? { ...s, ...patch } : s)),
      );
    },
    [],
  );

  const updateDiscussionItem = useCallback(
    (id: string, patch: Partial<DiscussionItem>) => {
      setDiscussionItems((prev) =>
        prev.map((d) => (d.id === id ? { ...d, ...patch } : d)),
      );
    },
    [],
  );

  const updateRedactionFlag = useCallback(
    (id: string, patch: Partial<RedactionFlag>) => {
      setRedactionFlags((prev) =>
        prev.map((r) => (r.id === id ? { ...r, ...patch } : r)),
      );
    },
    [],
  );

  const addRedactionFlag = useCallback((draft: Omit<RedactionFlag, "id">) => {
    const id = crypto.randomUUID();
    setRedactionFlags((prev) => [...prev, { ...draft, id }]);
  }, []);

  const value = useMemo(
    () => ({
      submissionItems,
      discussionItems,
      redactionFlags,
      updateSubmissionItem,
      updateDiscussionItem,
      updateRedactionFlag,
      addRedactionFlag,
    }),
    [
      submissionItems,
      discussionItems,
      redactionFlags,
      updateSubmissionItem,
      updateDiscussionItem,
      updateRedactionFlag,
      addRedactionFlag,
    ],
  );

  return (
    <ControlContext.Provider value={value}>{children}</ControlContext.Provider>
  );
}
