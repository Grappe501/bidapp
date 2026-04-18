import type { ReactNode } from "react";
import { Card } from "@/components/ui/Card";

export function ClientReviewSection({
  title,
  kicker,
  children,
}: {
  title: string;
  kicker?: string;
  children: ReactNode;
}) {
  return (
    <Card className="overflow-hidden">
      <div className="border-b border-border bg-zinc-50/80 px-5 py-3">
        {kicker ? (
          <p className="text-[10px] font-medium uppercase tracking-wide text-ink-subtle">
            {kicker}
          </p>
        ) : null}
        <h2 className="text-sm font-semibold text-ink">{title}</h2>
      </div>
      <div className="px-5 py-4 text-sm leading-relaxed text-ink">
        {children}
      </div>
    </Card>
  );
}
