import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import type { AgentMaloneSuggestedAction } from "@/types";

const linkBtn =
  "inline-flex items-center justify-center rounded-md border border-border bg-surface-raised px-3 py-1.5 text-xs font-medium text-ink shadow-sm transition-colors hover:bg-zinc-50";

function actionToPath(action: AgentMaloneSuggestedAction): string | null {
  if (action.target?.startsWith("/")) return action.target;
  return null;
}

export function AgentSuggestedActions({
  actions,
}: {
  actions: AgentMaloneSuggestedAction[];
}) {
  const usable = actions.filter((a) => a.actionType !== "none");
  if (usable.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2">
      {usable.map((a, i) => {
        const path = actionToPath(a);
        if (path) {
          return (
            <Link key={i} to={path} className={cn(linkBtn)}>
              {a.label}
            </Link>
          );
        }
        return (
          <span
            key={i}
            className="inline-flex cursor-not-allowed items-center rounded-md border border-border px-3 py-1.5 text-xs text-ink-muted opacity-60"
            title="No in-app route for this action in V1"
          >
            {a.label}
          </span>
        );
      })}
    </div>
  );
}
