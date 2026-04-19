import { Link } from "react-router-dom";
import type { AgentMaloneAnswer } from "@/types";

export function AgentEvidenceList({
  items,
}: {
  items: AgentMaloneAnswer["evidence"];
}) {
  if (items.length === 0) {
    return (
      <p className="text-xs text-ink-muted">No evidence items attached.</p>
    );
  }
  return (
    <ul className="space-y-1.5 text-sm">
      {items.map((e, i) => (
        <li key={i} className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
          <span className="font-medium text-ink">{e.label}</span>
          <span className="text-[11px] uppercase tracking-wide text-ink-muted">
            {e.sourceType.replace(/_/g, " ")}
          </span>
          {e.pageRoute ? (
            <Link
              to={e.pageRoute}
              className="text-xs font-medium text-ink underline-offset-2 hover:underline"
            >
              Open
            </Link>
          ) : null}
        </li>
      ))}
    </ul>
  );
}
