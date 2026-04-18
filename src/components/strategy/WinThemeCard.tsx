import { cn } from "@/lib/utils";
import type { WinTheme } from "@/types";

const statusStyle: Record<WinTheme["status"], string> = {
  Draft: "text-ink-muted",
  Active: "text-emerald-800",
  Approved: "text-sky-900",
  Retired: "text-ink-subtle line-through",
};

export function WinThemeCard({
  theme,
  onSelect,
  selected,
}: {
  theme: WinTheme;
  onSelect?: () => void;
  selected?: boolean;
}) {
  return (
    <div
      className={cn(
        "cursor-pointer rounded-lg border border-border bg-surface-raised p-4 shadow-sm transition-colors",
        selected && "ring-1 ring-inset ring-zinc-400",
      )}
      onClick={onSelect}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") onSelect?.();
      }}
      role={onSelect ? "button" : undefined}
      tabIndex={onSelect ? 0 : undefined}
    >
      <div className="flex items-start justify-between gap-2">
        <h3 className="text-sm font-semibold text-ink">{theme.title}</h3>
        <span className={`text-xs font-medium ${statusStyle[theme.status]}`}>
          {theme.status}
        </span>
      </div>
      <p className="mt-2 text-xs leading-relaxed text-ink-muted">{theme.summary}</p>
      <p className="mt-2 text-[10px] text-ink-subtle">
        P{theme.priority} · {theme.targetSections.join(", ")}
      </p>
    </div>
  );
}
