import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import type { AgentMaloneActionResult } from "@/types";

const statusStyles: Record<AgentMaloneActionResult["status"], string> = {
  success: "border-emerald-200 bg-emerald-50/90 text-emerald-950",
  partial: "border-amber-200 bg-amber-50/90 text-amber-950",
  failed: "border-rose-200 bg-rose-50/90 text-rose-950",
  blocked: "border-zinc-300 bg-zinc-50 text-ink",
};

export function AgentActionResult({ result }: { result: AgentMaloneActionResult }) {
  return (
    <div
      className={cn(
        "rounded-lg border px-4 py-3 text-sm shadow-sm",
        statusStyles[result.status],
      )}
    >
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <span className="text-xs font-semibold uppercase tracking-wide">
          Workflow · {result.actionType.replace(/_/g, " ")}
        </span>
        <span className="text-[11px] font-medium opacity-90">{result.status}</span>
      </div>
      <p className="mt-1 text-sm font-semibold">{result.headline}</p>
      <p className="mt-1 text-sm opacity-95">{result.summary}</p>
      {result.details && result.details.length > 0 ? (
        <ul className="mt-2 list-inside list-disc space-y-0.5 text-xs opacity-95">
          {result.details.slice(0, 8).map((d, i) => (
            <li key={i}>{d}</li>
          ))}
        </ul>
      ) : null}
      {result.errorMessage && result.status !== "success" ? (
        <p className="mt-2 text-xs opacity-90">{result.errorMessage}</p>
      ) : null}
      {result.nextActions && result.nextActions.length > 0 ? (
        <div className="mt-3 flex flex-wrap gap-2">
          {result.nextActions.map((a, i) =>
            a.target?.startsWith("/") ? (
              <Link
                key={i}
                to={a.target}
                className="text-xs font-medium underline underline-offset-2"
              >
                {a.label}
              </Link>
            ) : (
              <span key={i} className="text-xs opacity-80">
                {a.label}
              </span>
            ),
          )}
        </div>
      ) : null}
    </div>
  );
}
