import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";

export type SectionProps = HTMLAttributes<HTMLElement> & {
  title: string;
  children: ReactNode;
  action?: ReactNode;
};

export function Section({
  title,
  action,
  className,
  children,
  ...props
}: SectionProps) {
  return (
    <section
      className={cn("space-y-3", className)}
      {...props}
    >
      <div className="flex items-start justify-between gap-4">
        <h2 className="text-sm font-semibold tracking-wide text-ink">
          {title}
        </h2>
        {action ? <div className="shrink-0">{action}</div> : null}
      </div>
      <div>{children}</div>
    </section>
  );
}
