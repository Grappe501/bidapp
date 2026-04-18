import type { InputHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export type InputProps = InputHTMLAttributes<HTMLInputElement>;

export function Input({ className, type = "text", ...props }: InputProps) {
  return (
    <input
      type={type}
      className={cn(
        "w-full rounded-md border border-border bg-surface-raised px-3 py-2 text-sm text-ink shadow-sm placeholder:text-ink-subtle",
        "focus:border-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-200",
        "disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      {...props}
    />
  );
}
