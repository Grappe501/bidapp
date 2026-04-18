import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export type BadgeVariant = "neutral" | "muted" | "emphasis" | "warning";

export type BadgeProps = HTMLAttributes<HTMLSpanElement> & {
  variant?: BadgeVariant;
};

const variantClasses: Record<BadgeVariant, string> = {
  neutral: "bg-zinc-100 text-ink border border-zinc-200/80",
  muted: "bg-surface text-ink-muted border border-border",
  emphasis: "bg-zinc-900 text-white border border-zinc-900",
  warning: "bg-amber-50 text-amber-950 border border-amber-200/90",
};

export function Badge({
  className,
  variant = "neutral",
  ...props
}: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex max-w-full items-center rounded-md px-2 py-0.5 text-xs font-medium",
        variantClasses[variant],
        className,
      )}
      {...props}
    />
  );
}
