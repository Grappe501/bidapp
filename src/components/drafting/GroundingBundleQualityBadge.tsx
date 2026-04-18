import { cn } from "@/lib/utils";
import type { BundleQualityLabel } from "@/lib/drafting-utils";

type GroundingBundleQualityBadgeProps = {
  label: BundleQualityLabel;
  className?: string;
  /** Shown as native tooltip for “why” without cluttering the row. */
  title?: string;
};

const styles: Record<BundleQualityLabel, string> = {
  Strong:
    "border-emerald-200/90 bg-emerald-50/50 text-emerald-950/90",
  Moderate:
    "border-zinc-200 bg-zinc-100/80 text-ink",
  Weak:
    "border-zinc-300 bg-zinc-50 text-ink-muted",
};

export function GroundingBundleQualityBadge({
  label,
  className,
  title,
}: GroundingBundleQualityBadgeProps) {
  return (
    <span
      title={title}
      className={cn(
        "inline-flex items-center rounded border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
        styles[label],
        className,
      )}
    >
      Bundle strength: {label}
    </span>
  );
}
