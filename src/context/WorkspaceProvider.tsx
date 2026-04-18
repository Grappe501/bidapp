import {
  useCallback,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { MOCK_FILES } from "@/data/mockFiles";
import { MOCK_PROJECT } from "@/data/mockProject";
import { fileExtensionFromName } from "@/lib/utils";
import type { FileRecord } from "@/types";
import {
  WorkspaceContext,
  type UploadFileInput,
  type WorkspaceContextValue,
} from "./workspace-context";

function recordFromUpload(input: UploadFileInput): FileRecord {
  return {
    id: crypto.randomUUID(),
    name: input.file.name,
    category: input.category,
    sourceType: input.sourceType,
    uploadedAt: new Date().toISOString(),
    fileType: fileExtensionFromName(input.file.name),
    status: "Uploaded",
    tags: input.tags,
    noteCount: 0,
    linkedItemCount: 0,
    description: undefined,
  };
}

export function WorkspaceProvider({ children }: { children: ReactNode }) {
  const [files, setFiles] = useState<FileRecord[]>(() => [...MOCK_FILES]);

  const addUploadedFile = useCallback((input: UploadFileInput) => {
    setFiles((prev) => [recordFromUpload(input), ...prev]);
  }, []);

  const addUploadedFiles = useCallback((inputs: UploadFileInput[]) => {
    if (inputs.length === 0) return;
    setFiles((prev) => [...inputs.map(recordFromUpload), ...prev]);
  }, []);

  const updateFile = useCallback((id: string, patch: Partial<FileRecord>) => {
    setFiles((prev) =>
      prev.map((f) => (f.id === id ? { ...f, ...patch } : f)),
    );
  }, []);

  const value = useMemo<WorkspaceContextValue>(
    () => ({
      project: MOCK_PROJECT,
      files,
      addUploadedFile,
      addUploadedFiles,
      updateFile,
    }),
    [files, addUploadedFile, addUploadedFiles, updateFile],
  );

  return (
    <WorkspaceContext.Provider value={value}>
      {children}
    </WorkspaceContext.Provider>
  );
}
