import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  postLoadProjectWorkspace,
  type ProjectWorkspaceApiPayload,
} from "@/lib/functions-api";

type ProjectWorkspaceContextValue = {
  loading: boolean;
  error: string | null;
  projectId: string;
  workspace: ProjectWorkspaceApiPayload | null;
  refetch: () => Promise<void>;
};

const ProjectWorkspaceContext = createContext<ProjectWorkspaceContextValue | null>(
  null,
);

export function ProjectWorkspaceProvider({ children }: { children: ReactNode }) {
  const projectId = (import.meta.env.VITE_DEFAULT_PROJECT_ID ?? "").trim();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [workspace, setWorkspace] = useState<ProjectWorkspaceApiPayload | null>(
    null,
  );

  const load = useCallback(async () => {
    if (!projectId) {
      setLoading(false);
      setError("VITE_DEFAULT_PROJECT_ID is not set");
      setWorkspace(null);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data = await postLoadProjectWorkspace(projectId);
      setWorkspace(data);
    } catch (e) {
      setWorkspace(null);
      setError(
        e instanceof Error ? e.message : "Failed to load project workspace from API",
      );
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    void load();
  }, [load]);

  const value = useMemo<ProjectWorkspaceContextValue>(
    () => ({
      loading,
      error,
      projectId,
      workspace,
      refetch: load,
    }),
    [loading, error, projectId, workspace, load],
  );

  return (
    <ProjectWorkspaceContext.Provider value={value}>
      {children}
    </ProjectWorkspaceContext.Provider>
  );
}

export function useProjectWorkspace(): ProjectWorkspaceContextValue {
  const v = useContext(ProjectWorkspaceContext);
  if (!v) {
    throw new Error("useProjectWorkspace must be used within ProjectWorkspaceProvider");
  }
  return v;
}
