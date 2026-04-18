import { Badge } from "@/components/ui/Badge";
import { formatArchitectureOptionStatusLabel } from "@/lib/display-format";
import { cn } from "@/lib/utils";
import type { ArchitectureOption } from "@/types";

type ArchitectureOptionCardProps = {
  option: ArchitectureOption;
  selected: boolean;
  onSelect: () => void;
};

export function ArchitectureOptionCard({
  option,
  selected,
  onSelect,
}: ArchitectureOptionCardProps) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "w-full rounded-lg border p-4 text-left transition-colors",
        selected
          ? "border-zinc-800 bg-zinc-50 shadow-sm"
          : "border-border bg-surface-raised hover:border-zinc-300 hover:bg-zinc-50/50",
      )}
    >
      <div className="flex flex-wrap items-start justify-between gap-2">
        <h3 className="font-semibold leading-snug text-ink">{option.name}</h3>
        <div className="flex flex-wrap gap-1.5">
          {option.recommended ? (
            <Badge variant="emphasis">Recommended</Badge>
          ) : null}
          <Badge variant="muted">
            {formatArchitectureOptionStatusLabel(option.status)}
          </Badge>
        </div>
      </div>
      <p className="mt-2 line-clamp-2 text-sm text-ink-muted">{option.summary}</p>
      <p className="mt-3 text-xs text-ink-subtle">
        {option.components.length} stack component
        {option.components.length === 1 ? "" : "s"}
      </p>
    </button>
  );
}
