import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import type { AgentMaloneThread } from "@/types";

type Props = {
  threads: AgentMaloneThread[];
  activeId: string | null;
  onSelect: (id: string) => void;
  onNew: () => void;
  onArchive: (id: string) => void;
  disabled?: boolean;
};

export function AgentThreadSidebar({
  threads,
  activeId,
  onSelect,
  onNew,
  onArchive,
  disabled,
}: Props) {
  return (
    <div className="flex h-full min-h-0 flex-col border-r border-border bg-surface-raised">
      <div className="border-b border-border p-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-ink-muted">
          Threads
        </p>
        <Button
          type="button"
          variant="secondary"
          className="mt-2 w-full py-1.5 text-xs"
          disabled={disabled}
          onClick={onNew}
        >
          New thread
        </Button>
      </div>
      <ul className="flex-1 overflow-y-auto p-2 text-sm">
        {threads.map((t) => (
          <li key={t.id} className="mb-1">
            <div className="flex items-start gap-1">
              <button
                type="button"
                disabled={disabled}
                onClick={() => onSelect(t.id)}
                className={cn(
                  "flex-1 rounded-md px-2 py-1.5 text-left text-xs transition-colors",
                  activeId === t.id
                    ? "bg-zinc-200 font-medium text-ink"
                    : "text-ink-muted hover:bg-zinc-100",
                )}
              >
                <span className="line-clamp-2">{t.title}</span>
                {t.summaryLine ? (
                  <span className="mt-0.5 block line-clamp-2 text-[10px] text-ink-muted">
                    {t.summaryLine}
                  </span>
                ) : null}
              </button>
              <button
                type="button"
                title="Archive thread"
                disabled={disabled}
                className="shrink-0 rounded px-1 text-[10px] text-ink-muted hover:bg-zinc-100"
                onClick={() => onArchive(t.id)}
              >
                ×
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
