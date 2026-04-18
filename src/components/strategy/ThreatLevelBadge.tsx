import { cn } from "@/lib/utils";
import type { ThreatLevel } from "@/types";

const styles: Record<ThreatLevel, string> = {
  Low: "bg-zinc-100 text-ink-muted ring-zinc-200",
  Moderate: "bg-amber-50 text-amber-900 ring-amber-200/80",
  High: "bg-orange-50 text-orange-900 ring-orange-200/80",
  Critical: "bg-red-50 text-red-900 ring-red-200/80",
};

export function ThreatLevelBadge({
  level,
  className,
}: {
  level: ThreatLevel;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex rounded-md px-2 py-0.5 text-xs font-medium ring-1 ring-inset",
        styles[level],
        className,
      )}
    >
      {level}
    </span>
  );
}
