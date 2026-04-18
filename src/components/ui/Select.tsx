import type { SelectHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export type SelectProps = SelectHTMLAttributes<HTMLSelectElement>;

export function Select({ className, children, ...props }: SelectProps) {
  return (
    <select
      className={cn(
        "w-full rounded-md border border-border bg-surface-raised px-3 py-2 text-sm text-ink shadow-sm",
        "focus:border-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-200",
        "disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      {...props}
    >
      {children}
    </select>
  );
}
