import { Card } from "@/components/ui/Card";
import { DRAFTING_COPY } from "@/lib/drafting-copy";
import { pageOverflowRisk, SECTION_FOCUS } from "@/lib/drafting-utils";
import type { DraftMetadata, DraftSectionType } from "@/types";

type DraftMetadataCardProps = {
  sectionType: DraftSectionType;
  metadata: DraftMetadata | null;
  /** True when editor text diverges from the saved version or word count no longer matches structured metadata. */
  metricsMayBeStale?: boolean;
};

export function DraftMetadataCard({
  sectionType,
  metadata,
  metricsMayBeStale,
}: DraftMetadataCardProps) {
  const max = SECTION_FOCUS[sectionType].maxPages;
  if (!metadata) {
    return (
      <Card className="border-dashed border-zinc-300 bg-zinc-50/40 p-4 text-xs text-ink-muted">
        <p className="font-medium text-ink">No draft metadata yet</p>
        <p className="mt-1 leading-relaxed">
          Metadata appears after you generate a draft or save a version. It carries
          structured coverage IDs and flags from the last model-aligned save.
        </p>
      </Card>
    );
  }

  const overflow = pageOverflowRisk(metadata.estimatedPages, max);

  return (
    <Card className="space-y-2 p-4 text-xs">
      <h3 className="font-semibold text-ink">Draft metadata</h3>
      {metricsMayBeStale ? (
        <p className="rounded-md border border-zinc-200 bg-zinc-50/90 px-2.5 py-2 text-[11px] leading-relaxed text-ink-muted">
          <span className="font-medium text-ink">Coverage may be out of date.</span>{" "}
          Word counts below reflect the last saved version; requirement coverage and
          flags still describe the last structured output. Save a new version after
          large edits to realign metrics, or treat this as directional only.
        </p>
      ) : null}
      <p className="text-ink-muted">
        Words: <span className="font-medium text-ink">{metadata.wordCount}</span>{" "}
        · Est. pages:{" "}
        <span className="font-medium text-ink">{metadata.estimatedPages}</span> /{" "}
        {max}{" "}
        {overflow === "over" ? (
          <span className="text-amber-900">(over page cap)</span>
        ) : overflow === "near" ? (
          <span className="text-ink">(near page cap)</span>
        ) : null}
      </p>
      <p className="text-ink-muted">
        Coverage: {metadata.requirementCoverageIds.length} addressed ·{" "}
        {metadata.missingRequirementIds.length} missing
      </p>
      <p className="text-ink-muted">
        Unsupported claim flags: {metadata.unsupportedClaimFlags.length} · Risk
        flags: {metadata.riskFlags.length}
      </p>
      {metadata.generationMode ? (
        <p className="text-ink-muted">
          Last structured generation:{" "}
          <span className="font-medium text-ink">{metadata.generationMode}</span>
        </p>
      ) : null}
      <p className="border-t border-border/50 pt-2 text-[11px] text-ink-subtle">
        {DRAFTING_COPY.metadataFooterHint}
      </p>
    </Card>
  );
}
