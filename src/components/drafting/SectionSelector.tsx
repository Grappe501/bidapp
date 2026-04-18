import { Link } from "react-router-dom";
import { Card } from "@/components/ui/Card";
import type { DraftSection, DraftVersion } from "@/types";
import {
  SECTION_FOCUS,
  coverageHealth,
  type CoverageHealth,
} from "@/lib/drafting-utils";
import type { SelectedBundle } from "@/context/drafting-context";

type SectionSelectorProps = {
  sections: DraftSection[];
  getActiveVersion: (sectionId: string) => DraftVersion | undefined;
  getSelectedBundle: (sectionId: string) => SelectedBundle | null;
};

function coverageLabel(health: CoverageHealth): string {
  if (health === "complete") return "On track";
  if (health === "partial") return "Gaps remain";
  return "Needs attention";
}

export function SectionSelector({
  sections,
  getActiveVersion,
  getSelectedBundle,
}: SectionSelectorProps) {
  return (
    <div className="space-y-3">
      {sections.map((s) => {
        const v = getActiveVersion(s.id);
        const meta = v?.metadata ?? null;
        const bundle = getSelectedBundle(s.id);
        const bundleReqCount = bundle?.payload.requirements.length ?? 0;
        const health = coverageHealth(meta, bundleReqCount, bundle?.payload ?? null);
        const cap = SECTION_FOCUS[s.sectionType].maxPages;
        const focusShort = SECTION_FOCUS[s.sectionType].focus;
        const bundleLine = bundle
          ? "Grounding bundle attached"
          : "No grounding bundle attached";

        return (
          <Card
            key={s.id}
            className="border-zinc-300/40 p-4 transition-colors hover:border-zinc-400/50"
          >
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0 flex-1 space-y-2">
                <div>
                  <h2 className="text-sm font-semibold text-ink">{s.title}</h2>
                  <p className="mt-1 text-xs text-ink-muted">
                    Draft status:{" "}
                    <span className="font-semibold text-ink">{s.status}</span>
                  </p>
                </div>
                <dl className="grid gap-1 text-xs text-ink-muted sm:grid-cols-2">
                  <div>
                    <dt className="text-ink-subtle">Page cap</dt>
                    <dd className="font-medium text-ink">Max {cap} pages</dd>
                  </div>
                  <div>
                    <dt className="text-ink-subtle">Requirement coverage</dt>
                    <dd className="font-medium text-ink">{coverageLabel(health)}</dd>
                  </div>
                  <div className="sm:col-span-2">
                    <dt className="text-ink-subtle">Grounding bundle</dt>
                    <dd className="text-ink">{bundleLine}</dd>
                  </div>
                </dl>
                <p className="text-xs leading-relaxed text-ink-subtle">
                  {focusShort}
                </p>
              </div>
              <Link
                to={`/drafts/${s.id}`}
                className="inline-flex shrink-0 items-center justify-center rounded-md border border-border bg-surface-raised px-4 py-2 text-sm font-medium text-ink shadow-sm hover:bg-zinc-50"
              >
                Open workspace
              </Link>
            </div>
          </Card>
        );
      })}
    </div>
  );
}
