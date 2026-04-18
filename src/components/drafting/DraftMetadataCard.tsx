import { Card } from "@/components/ui/Card";
import type { DraftMetadata } from "@/types";
import { pageOverflowRisk, SECTION_FOCUS } from "@/lib/drafting-utils";
import type { DraftSectionType } from "@/types";

type DraftMetadataCardProps = {
  sectionType: DraftSectionType;
  metadata: DraftMetadata | null;
};

export function DraftMetadataCard({
  sectionType,
  metadata,
}: DraftMetadataCardProps) {
  const max = SECTION_FOCUS[sectionType].maxPages;
  if (!metadata) {
    return (
      <Card className="p-4 text-xs text-ink-muted">
        No metadata — generate or save a version.
      </Card>
    );
  }

  const overflow = pageOverflowRisk(metadata.estimatedPages, max);

  return (
    <Card className="space-y-2 p-4 text-xs">
      <h3 className="font-semibold text-ink">Draft metrics</h3>
      <p className="text-ink-muted">
        Words: <span className="font-medium text-ink">{metadata.wordCount}</span>{" "}
        · Est. pages:{" "}
        <span className="font-medium text-ink">{metadata.estimatedPages}</span> /{" "}
        {max}{" "}
        {overflow === "over" ? (
          <span className="text-red-700">(over)</span>
        ) : overflow === "near" ? (
          <span className="text-amber-800">(near cap)</span>
        ) : null}
      </p>
      <p className="text-ink-muted">
        Covered reqs: {metadata.requirementCoverageIds.length} · Missing:{" "}
        {metadata.missingRequirementIds.length}
      </p>
      <p className="text-ink-muted">
        Unsupported flags: {metadata.unsupportedClaimFlags.length} · Risk flags:{" "}
        {metadata.riskFlags.length}
      </p>
    </Card>
  );
}
