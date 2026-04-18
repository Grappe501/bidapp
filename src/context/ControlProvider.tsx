import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useProjectWorkspace } from "@/context/project-workspace-context";
import type { DiscussionItem, RedactionFlag, SubmissionItem } from "@/types";
import { ControlContext } from "./control-context";

export function ControlProvider({ children }: { children: ReactNode }) {
  const { workspace } = useProjectWorkspace();
  const [submissionItems, setSubmissionItems] = useState<SubmissionItem[]>([]);
  const [discussionItems, setDiscussionItems] = useState<DiscussionItem[]>([]);
  const [redactionFlags, setRedactionFlags] = useState<RedactionFlag[]>([]);

  useEffect(() => {
    if (!workspace) return;
    setSubmissionItems(workspace.submissionItems);
  }, [workspace]);

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
