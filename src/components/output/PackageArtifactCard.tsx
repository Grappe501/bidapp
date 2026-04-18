import { Link } from "react-router-dom";
import { Card } from "@/components/ui/Card";
import { artifactSourcePath } from "@/lib/output-utils";
import type { OutputArtifact } from "@/types";
import { OutputStatusBadge } from "./OutputStatusBadge";

export function PackageArtifactCard({ artifact }: { artifact: OutputArtifact }) {
  const ref = artifactSourcePath(artifact);
  return (
    <Card className="p-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className="text-xs text-ink-subtle">{artifact.artifactType}</p>
          <h3 className="mt-0.5 text-sm font-medium text-ink">{artifact.title}</h3>
          {artifact.notes ? (
            <p className="mt-2 text-xs leading-relaxed text-ink-muted">
              {artifact.notes}
            </p>
          ) : null}
        </div>
        <div className="flex flex-col items-end gap-1">
          <OutputStatusBadge status={artifact.status} />
          <span className="text-[10px] text-ink-subtle">
            {artifact.isValidated ? "Validated path" : "Needs validation"}
          </span>
        </div>
      </div>
      {ref ? (
        <Link
          to={ref.to}
          className="mt-3 inline-block text-xs font-medium text-ink underline-offset-2 hover:underline"
        >
          {ref.label} →
        </Link>
      ) : null}
    </Card>
  );
}
