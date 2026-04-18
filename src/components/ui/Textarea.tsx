import type { TextareaHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement>;

export function Textarea({ className, rows = 3, ...props }: TextareaProps) {
  return (
    <textarea
      rows={rows}
      className={cn(
        "w-full resize-y rounded-md border border-border bg-surface-raised px-3 py-2 text-sm text-ink shadow-sm placeholder:text-ink-subtle",
        "focus:border-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-200",
        "disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      {...props}
    />
  );
}
