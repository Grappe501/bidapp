import { useProjectWorkspace } from "@/context/project-workspace-context";

export function WorkspaceStatusBanner() {
  const { loading, error, workspace } = useProjectWorkspace();

  if (loading) {
    return (
      <div className="border-b border-zinc-200 bg-zinc-50 px-4 py-2 text-center text-xs text-ink-muted">
        Loading workspace from database…
      </div>
    );
  }

  if (error) {
    return (
      <div className="border-b border-amber-200 bg-amber-50 px-4 py-2 text-center text-xs text-amber-950">
        Workspace could not be loaded: {error}
      </div>
    );
  }

  if (!workspace) {
    return (
      <div className="border-b border-amber-200 bg-amber-50 px-4 py-2 text-center text-xs text-amber-950">
        No workspace data — check project ID and API configuration.
      </div>
    );
  }

  return null;
}
