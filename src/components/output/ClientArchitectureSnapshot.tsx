import { Link } from "react-router-dom";
import { Card } from "@/components/ui/Card";
import type { ArchitectureOption } from "@/types";

/** Compact stack view for the packet — sits after draft status per review flow. */
export function ClientArchitectureSnapshot({
  option,
}: {
  option: ArchitectureOption | undefined;
}) {
  if (!option) {
    return (
      <Card className="p-5">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-ink-subtle">
          Architecture recommendation
        </h2>
        <p className="mt-2 text-sm text-ink-muted">
          Once an option is recommended, the stack and dependency narrative will appear
          here for client readouts.
        </p>
      </Card>
    );
  }

  return (
    <Card className="p-0">
      <div className="border-b border-border bg-zinc-50/80 px-5 py-3">
        <p className="text-[10px] font-semibold uppercase tracking-wide text-ink-subtle">
          Architecture recommendation
        </p>
        <h2 className="mt-1 text-sm font-semibold text-ink">Stack in this packet</h2>
        <p className="mt-1 text-xs text-ink-muted">{option.name}</p>
      </div>
      <div className="px-5 py-4">
        <ul className="space-y-2 text-sm">
          {option.components.map((c) => (
            <li key={c.id} className="flex flex-wrap gap-x-2 leading-snug">
              <span className="font-medium text-ink">{c.vendorName}</span>
              <span className="text-ink-muted">· {c.role}</span>
              {c.optional ? (
                <span className="text-[10px] font-medium uppercase text-ink-subtle">
                  Optional
                </span>
              ) : null}
            </li>
          ))}
        </ul>
        {option.implementationRisks.length ? (
          <div className="mt-4 rounded-md border border-amber-200/60 bg-amber-50/30 px-3 py-2">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-amber-950/80">
              Dependency watchout
            </p>
            <p className="mt-1 text-xs leading-relaxed text-amber-950/90">
              {option.implementationRisks[0]}
            </p>
          </div>
        ) : null}
        <Link
          to="/architecture"
          className="mt-4 inline-block text-xs font-semibold text-ink underline-offset-2 hover:underline"
        >
          Architecture workspace →
        </Link>
      </div>
    </Card>
  );
}
