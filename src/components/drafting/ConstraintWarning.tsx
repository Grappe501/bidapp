import { Card } from "@/components/ui/Card";
import type { DraftMetadata, DraftSectionType } from "@/types";
import { buildConstraintMessages, SECTION_FOCUS } from "@/lib/drafting-utils";

type ConstraintWarningProps = {
  sectionType: DraftSectionType;
  metadata: DraftMetadata | null;
};

export function ConstraintWarning({
  sectionType,
  metadata,
}: ConstraintWarningProps) {
  const max = SECTION_FOCUS[sectionType].maxPages;
  const msgs = buildConstraintMessages({
    sectionType,
    meta: metadata,
    maxPages: max,
  });

  if (msgs.length === 0) {
    return (
      <Card className="border-emerald-200/80 bg-emerald-50/40 p-3 text-xs text-ink-muted">
        No constraint violations detected from current metrics.
      </Card>
    );
  }

  return (
    <Card className="border-amber-200/90 bg-amber-50/50 p-3">
      <h3 className="text-xs font-semibold text-amber-950">Constraint warnings</h3>
      <ul className="mt-2 list-inside list-disc text-xs text-amber-950/90">
        {msgs.map((m) => (
          <li key={m.slice(0, 40)}>{m}</li>
        ))}
      </ul>
    </Card>
  );
}
