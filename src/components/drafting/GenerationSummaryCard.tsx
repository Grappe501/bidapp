import { Card } from "@/components/ui/Card";
import type { DraftMetadata } from "@/types";

type GenerationSummaryCardProps = {
  metadata: DraftMetadata;
};

export function GenerationSummaryCard({ metadata }: GenerationSummaryCardProps) {
  const mode = metadata.generationMode;

  return (
    <Card className="space-y-3 border-zinc-200/90 bg-white p-4 text-xs">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h3 className="text-[10px] font-semibold uppercase tracking-wide text-ink-subtle">
          Last generation output
        </h3>
        {mode ? (
          <p className="text-[11px] text-ink-muted">
            Mode: <span className="font-medium text-ink">{mode}</span>
          </p>
        ) : null}
      </div>
      <dl className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <div>
          <dt className="text-ink-subtle">Est. pages</dt>
          <dd className="text-sm font-semibold text-ink">
            {metadata.estimatedPages}
          </dd>
        </div>
        <div>
          <dt className="text-ink-subtle">Word count</dt>
          <dd className="text-sm font-semibold text-ink">{metadata.wordCount}</dd>
        </div>
        <div>
          <dt className="text-ink-subtle">Requirements covered</dt>
          <dd className="text-sm font-semibold text-ink">
            {metadata.requirementCoverageIds.length}
          </dd>
        </div>
        <div>
          <dt className="text-ink-subtle">Requirements missing</dt>
          <dd className="text-sm font-semibold text-ink">
            {metadata.missingRequirementIds.length}
          </dd>
        </div>
        <div>
          <dt className="text-ink-subtle">Unsupported-claim flags</dt>
          <dd className="text-sm font-semibold text-ink">
            {metadata.unsupportedClaimFlags.length}
          </dd>
        </div>
        <div>
          <dt className="text-ink-subtle">Risk flags</dt>
          <dd className="text-sm font-semibold text-ink">
            {metadata.riskFlags.length}
          </dd>
        </div>
      </dl>
      <p className="text-[11px] leading-relaxed text-ink-subtle">
        Full draft metadata for the active version also appears below in the
        metadata card. Counts come from model-structured output and are reconciled
        with bundle requirements on the server.
      </p>
    </Card>
  );
}
