import { Link } from "react-router-dom";
import { Card } from "@/components/ui/Card";
import { artifactSourcePath } from "@/lib/output-utils";
import type { OutputArtifact } from "@/types";
import { OutputStatusBadge } from "./OutputStatusBadge";

export function OutputSectionCard({
  artifact,
  onCopy,
}: {
  artifact: OutputArtifact;
  onCopy?: () => void;
}) {
  const ref = artifactSourcePath(artifact);
  return (
    <Card className="flex flex-col gap-2 p-4">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-xs font-medium text-ink-subtle">
            {artifact.artifactType}
          </p>
          <h3 className="mt-0.5 text-sm font-semibold text-ink">
            {artifact.title}
          </h3>
        </div>
        <OutputStatusBadge status={artifact.status} />
      </div>
      {artifact.notes ? (
        <p className="text-xs leading-relaxed text-ink-muted">{artifact.notes}</p>
      ) : null}
      <div className="mt-auto flex flex-wrap gap-2 pt-1">
        {ref ? (
          <Link
            to={ref.to}
            className="text-xs font-medium text-ink underline-offset-2 hover:underline"
          >
            {ref.label}
          </Link>
        ) : null}
        {onCopy ? (
          <button
            type="button"
            onClick={onCopy}
            className="text-xs font-medium text-ink-muted hover:text-ink"
          >
            Copy text
          </button>
        ) : null}
      </div>
    </Card>
  );
}
