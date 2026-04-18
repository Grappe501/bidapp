import {
  useCallback,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { fileExtensionFromName } from "@/lib/utils";
import type { FileRecord, Project } from "@/types";
import {
  WorkspaceContext,
  type UploadFileInput,
  type WorkspaceContextValue,
} from "./workspace-context";
import { useProjectWorkspace } from "./project-workspace-context";

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

function placeholderProject(
  id: string,
  title: string,
  bidNumber: string,
): Project {
  return {
    id,
    title,
    bidNumber,
    issuingOrganization: "—",
    dueDate: "",
    status: "Drafting",
    shortDescription: "",
  };
}

/**
 * Files and project come from Postgres via {@link ProjectWorkspaceProvider}.
 * New uploads are session-only until a file-create API is wired.
 */
export function WorkspaceProvider({ children }: { children: ReactNode }) {
  const { workspace, loading, error, projectId } = useProjectWorkspace();
  const [sessionFiles, setSessionFiles] = useState<FileRecord[]>([]);

  const files = useMemo(() => {
    const dbFiles = workspace?.files ?? [];
    return [...sessionFiles, ...dbFiles];
  }, [sessionFiles, workspace?.files]);

  const addUploadedFile = useCallback((input: UploadFileInput) => {
    setSessionFiles((prev) => [recordFromUpload(input), ...prev]);
  }, []);

  const addUploadedFiles = useCallback((inputs: UploadFileInput[]) => {
    if (inputs.length === 0) return;
    setSessionFiles((prev) => [...inputs.map(recordFromUpload), ...prev]);
  }, []);

  const updateFile = useCallback((id: string, patch: Partial<FileRecord>) => {
    setSessionFiles((prev) =>
      prev.map((f) => (f.id === id ? { ...f, ...patch } : f)),
    );
  }, []);

  const project: Project = workspace?.project
    ? workspace.project
    : loading
      ? placeholderProject(projectId || "", "Loading workspace…", "—")
      : placeholderProject(
          projectId || "",
          error ? "Workspace unavailable" : "No project data",
          "—",
        );

  const value = useMemo<WorkspaceContextValue>(
    () => ({
      project,
      files,
      addUploadedFile,
      addUploadedFiles,
      updateFile,
    }),
    [project, files, addUploadedFile, addUploadedFiles, updateFile],
  );

  return (
    <WorkspaceContext.Provider value={value}>{children}</WorkspaceContext.Provider>
  );
}
