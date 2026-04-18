import { Card } from "@/components/ui/Card";
import { cn } from "@/lib/utils";
import {
  buildConstraintGuidance,
  SECTION_FOCUS,
  type ConstraintGuidanceItem,
} from "@/lib/drafting-utils";
import type { DraftMetadata, DraftSectionType } from "@/types";
import type { GroundingBundlePayload } from "@/types";

type ConstraintWarningProps = {
  sectionType: DraftSectionType;
  metadata: DraftMetadata | null;
  bundle: GroundingBundlePayload | null;
};

function severityRow(item: ConstraintGuidanceItem) {
  if (item.severity === "critical") {
    return {
      label: "Must address",
      labelCls: "text-amber-950/90",
    };
  }
  if (item.severity === "attention") {
    return {
      label: "Review",
      labelCls: "text-ink-muted",
    };
  }
  return {
    label: "Advisory",
    labelCls: "text-ink-subtle",
  };
}

export function ConstraintWarning({
  sectionType,
  metadata,
  bundle,
}: ConstraintWarningProps) {
  const max = SECTION_FOCUS[sectionType].maxPages;
  const items = buildConstraintGuidance({
    sectionType,
    meta: metadata,
    maxPages: max,
    bundle,
  });

  if (!metadata) {
    return (
      <Card className="border-dashed border-zinc-300 bg-zinc-50/40 p-4 text-xs text-ink-muted">
        <p className="font-medium text-ink">Constraint risk not evaluated</p>
        <p className="mt-1 leading-relaxed">
          Page budget and claim discipline checks run once structured metadata exists
          for this version.
        </p>
      </Card>
    );
  }

  if (items.length === 0) {
    return (
      <Card className="border-emerald-200/70 bg-emerald-50/35 p-4 text-xs text-ink-muted">
        <p className="font-medium text-emerald-950/90">No constraint risk flagged</p>
        <p className="mt-1 leading-relaxed">
          Metadata does not surface page budget, unsupported claim, or grounding-bundle
          shape warnings — continue with human review of facts and RFP alignment.
        </p>
      </Card>
    );
  }

  return (
    <Card className="space-y-3 border-amber-200/75 bg-amber-50/35 p-4">
      <div>
        <h3 className="text-xs font-semibold text-amber-950">Constraint risk</h3>
        <p className="mt-1 text-[11px] leading-relaxed text-amber-950/80">
          Prioritized from structured metadata and light grounding-bundle checks — not a
          full compliance engine.
        </p>
      </div>
      <ul className="space-y-3">
        {items.map((item) => {
          const row = severityRow(item);
          return (
            <li
              key={item.message.slice(0, 48)}
              className={cn(
                "flex gap-2 border-l-2 pl-2.5 text-xs leading-relaxed",
                item.severity === "critical"
                  ? "border-amber-500 text-amber-950"
                  : item.severity === "attention"
                    ? "border-zinc-400 text-ink"
                    : "border-zinc-200 text-ink-muted",
              )}
            >
              <span className={cn("mt-0.5 shrink-0 font-semibold", row.labelCls)}>
                {row.label}:
              </span>
              <span>{item.message}</span>
            </li>
          );
        })}
      </ul>
    </Card>
  );
}
