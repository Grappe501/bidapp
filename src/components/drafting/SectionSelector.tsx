import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/Badge";
import type { DraftSection } from "@/types";
import {
  SECTION_FOCUS,
  coverageHealth,
  type CoverageHealth,
} from "@/lib/drafting-utils";
import type { DraftVersion } from "@/types";

type SectionSelectorProps = {
  sections: DraftSection[];
  getActiveVersion: (sectionId: string) => DraftVersion | undefined;
};

function coverageBadge(health: CoverageHealth) {
  if (health === "complete") {
    return <Badge variant="emphasis">Coverage: complete</Badge>;
  }
  if (health === "partial") {
    return <Badge variant="neutral">Coverage: partial</Badge>;
  }
  return <Badge variant="neutral">Coverage: weak</Badge>;
}

export function SectionSelector({
  sections,
  getActiveVersion,
}: SectionSelectorProps) {
  return (
    <ul className="divide-y divide-border rounded-lg border border-border bg-surface-raised">
      {sections.map((s) => {
        const v = getActiveVersion(s.id);
        const meta = v?.metadata ?? null;
        const totalReq = meta
          ? meta.requirementCoverageIds.length +
            meta.missingRequirementIds.length
          : 0;
        const health = coverageHealth(meta, Math.max(0, totalReq));
        const cap = SECTION_FOCUS[s.sectionType].maxPages;
        return (
          <li
            key={s.id}
            className="flex flex-wrap items-center justify-between gap-3 px-4 py-3"
          >
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-medium text-ink">{s.title}</span>
                <Badge variant="neutral">{s.status}</Badge>
                {coverageBadge(health)}
              </div>
              <p className="mt-1 text-xs text-ink-muted">
                Max {cap} pages · {SECTION_FOCUS[s.sectionType].focus.slice(0, 80)}
                …
              </p>
            </div>
            <Link
              to={`/drafts/${s.id}`}
              className="inline-flex shrink-0 items-center justify-center rounded-md border border-border bg-surface-raised px-3 py-2 text-sm font-medium text-ink shadow-sm hover:bg-zinc-50"
            >
              Open
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
