import type { ReactNode } from "react";

export function CompetitorStrengthList({
  title = "Likely strengths",
  items,
  footer,
}: {
  title?: string;
  items: string[];
  footer?: ReactNode;
}) {
  return (
    <div>
      <h3 className="text-xs font-semibold uppercase tracking-wide text-ink-subtle">
        {title}
      </h3>
      <ul className="mt-2 list-inside list-disc space-y-1 text-sm text-ink-muted">
        {items.map((s) => (
          <li key={s}>{s}</li>
        ))}
      </ul>
      {footer}
    </div>
  );
}
