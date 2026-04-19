import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import type { AgentMaloneWorkingMemory } from "@/types";

export function AgentMemoryPanel({
  items,
  onClearAll,
  disabled,
}: {
  items: AgentMaloneWorkingMemory[];
  onClearAll: () => void;
  disabled?: boolean;
}) {
  if (items.length === 0) {
    return (
      <Card className="p-3 text-xs text-ink-muted">
        Working memory is empty. Context will build from page URL, explicit chat
        commands (&quot;set vendor to …&quot;, &quot;clear memory&quot;), and
        workflow results.
      </Card>
    );
  }
  return (
    <Card className="space-y-2 p-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-ink-muted">
          Working memory
        </p>
        <Button
          type="button"
          variant="secondary"
          className="py-1 text-[11px]"
          disabled={disabled}
          onClick={onClearAll}
        >
          Clear all
        </Button>
      </div>
      <ul className="max-h-48 space-y-1.5 overflow-y-auto text-[11px]">
        {items.map((m) => (
          <li
            key={m.id}
            className="rounded border border-border/80 bg-zinc-50/80 px-2 py-1"
          >
            <span className="font-medium text-ink-muted">
              {m.memoryKey.replace(/_/g, " ")}
            </span>
            {m.confidence ? (
              <span className="ml-1 text-ink-muted">({m.confidence})</span>
            ) : null}
            <span className="ml-1 text-[10px] text-ink-muted">
              [{m.source.replace(/_/g, " ")}]
            </span>
            <p className="mt-0.5 break-words text-ink">{m.memoryValue}</p>
          </li>
        ))}
      </ul>
    </Card>
  );
}
