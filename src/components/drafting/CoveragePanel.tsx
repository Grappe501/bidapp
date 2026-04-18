import { Card } from "@/components/ui/Card";
import type { DraftMetadata } from "@/types";
import type { GroundingBundlePayload } from "@/types";

type CoveragePanelProps = {
  bundle: GroundingBundlePayload | null;
  metadata: DraftMetadata | null;
};

export function CoveragePanel({ bundle, metadata }: CoveragePanelProps) {
  return (
    <Card className="space-y-3 p-4">
      <h2 className="text-sm font-semibold text-ink">Coverage</h2>
      {!bundle ? (
        <p className="text-xs text-ink-muted">Attach a grounding bundle.</p>
      ) : (
        <div className="text-xs text-ink-muted">
          <p>
            Bundle requirements: {bundle.requirements.length} · Evidence:{" "}
            {bundle.evidence.length}
          </p>
          {metadata ? (
            <>
              <p className="mt-2 font-medium text-ink">Addressed in metadata</p>
              <ul className="mt-1 max-h-24 list-inside list-disc overflow-y-auto">
                {metadata.requirementCoverageIds.slice(0, 8).map((id) => (
                  <li key={id}>{id.slice(0, 8)}…</li>
                ))}
              </ul>
              {metadata.missingRequirementIds.length > 0 ? (
                <>
                  <p className="mt-2 font-medium text-amber-900">Missing</p>
                  <ul className="mt-1 max-h-20 list-inside list-disc overflow-y-auto">
                    {metadata.missingRequirementIds.slice(0, 8).map((id) => (
                      <li key={id}>{id.slice(0, 8)}…</li>
                    ))}
                  </ul>
                </>
              ) : null}
            </>
          ) : (
            <p className="mt-2">Generate a draft to compute coverage hints.</p>
          )}
          <p className="mt-2 text-ink-subtle">
            Weak evidence: flag items with{" "}
            <span className="font-medium">Unverified</span> or{" "}
            <span className="font-medium">Pending</span> in bundle.
          </p>
        </div>
      )}
    </Card>
  );
}
