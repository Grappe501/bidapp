import { Badge, type BadgeVariant } from "@/components/ui/Badge";
import {
  formatRequirementSupportDetailLabel,
  formatRequirementSupportMatrixLabel,
} from "@/lib/display-format";
import type { RequirementSupportSummaryLevel } from "@/types";
import { cn } from "@/lib/utils";

const LEVEL_VARIANT: Record<RequirementSupportSummaryLevel, BadgeVariant> = {
  None: "muted",
  Weak: "warning",
  Moderate: "neutral",
  Strong: "emphasis",
};

type RequirementSupportSummaryProps = {
  level: RequirementSupportSummaryLevel;
  variant: "matrix" | "detail";
  className?: string;
};

export function RequirementSupportSummary({
  level,
  variant,
  className,
}: RequirementSupportSummaryProps) {
  const label =
    variant === "matrix"
      ? formatRequirementSupportMatrixLabel(level)
      : formatRequirementSupportDetailLabel(level);

  if (variant === "detail") {
    return (
      <div
        className={cn(
          "rounded-lg border border-border bg-zinc-50/70 px-4 py-3",
          className,
        )}
      >
        <p className="text-xs font-medium uppercase tracking-wider text-ink-subtle">
          Evidence support
        </p>
        <p className="mt-1 flex flex-wrap items-center gap-2">
          <Badge variant={LEVEL_VARIANT[level]}>{label}</Badge>
          <span className="text-sm text-ink-muted">
            Based on linked passages and declared strength.
          </span>
        </p>
      </div>
    );
  }

  return (
    <Badge variant={LEVEL_VARIANT[level]} className={className}>
      {label}
    </Badge>
  );
}
