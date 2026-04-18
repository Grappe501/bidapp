import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import type { SectionConstraint } from "@/types";

export function SectionConstraintCard({ constraint }: { constraint: SectionConstraint }) {
  return (
    <Card className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="font-semibold text-ink">{constraint.section}</h3>
        <Badge variant="emphasis">
          Max {constraint.maxPages} {constraint.maxPages === 1 ? "page" : "pages"}
        </Badge>
      </div>
      <p className="text-sm leading-relaxed text-ink-muted">{constraint.rules}</p>
    </Card>
  );
}
