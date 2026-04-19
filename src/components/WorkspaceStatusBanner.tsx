import { useProjectWorkspace } from "@/context/project-workspace-context";
import { isDemoModeClient } from "@/lib/demo-mode";

export function WorkspaceStatusBanner() {
  const { loading, error, workspace } = useProjectWorkspace();
  const demo = isDemoModeClient();

  if (loading) {
    return (
      <div className="border-b border-zinc-200 bg-zinc-50 px-4 py-2 text-center text-xs text-ink-muted">
        {demo ? "Loading workspace…" : "Loading workspace from database…"}
      </div>
    );
  }

  if (error) {
    return (
      <div className="border-b border-amber-200 bg-amber-50 px-4 py-2 text-center text-xs text-amber-950">
        {demo
          ? "Workspace could not be loaded. Confirm deployment settings with your team."
          : `Workspace could not be loaded: ${error}`}
      </div>
    );
  }

  if (!workspace) {
    return (
      <div className="border-b border-amber-200 bg-amber-50 px-4 py-2 text-center text-xs text-amber-950">
        {demo
          ? "No workspace data for this session — confirm the active project with your operator."
          : "No workspace data — check project ID and API configuration."}
      </div>
    );
  }

  return null;
}
