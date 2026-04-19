import { useProjectWorkspace } from "@/context/project-workspace-context";
import { isDemoModeClient } from "@/lib/demo-mode";
import { isStrictDbModeClient } from "@/lib/strict-client-env";

/**
 * Subtle one-line notice for private / strict-DB deployments (not a debug panel).
 */
export function PrivateDeployBanner() {
  const { projectId, error } = useProjectWorkspace();
  if (isDemoModeClient()) return null;
  if (!isStrictDbModeClient()) return null;

  return (
    <div className="border-b border-emerald-900/15 bg-emerald-50/80 px-4 py-1.5 text-center text-[11px] text-emerald-950/90">
      Private deploy · Strict DB mode · Project{" "}
      <span className="font-mono">
        {projectId || "—"}
      </span>
      {error ? (
        <span className="text-amber-900"> · Workspace error — see banner below</span>
      ) : null}
    </div>
  );
}
