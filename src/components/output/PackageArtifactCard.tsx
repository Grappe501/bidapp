import { Link } from "react-router-dom";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { artifactSourcePath } from "@/lib/output-utils";
import type { OutputArtifact } from "@/types";
import { OutputStatusBadge } from "./OutputStatusBadge";

function formatUpdated(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export function PackageArtifactCard({
  artifact,
  onCopyPlainText,
}: {
  artifact: OutputArtifact;
  onCopyPlainText?: () => void;
}) {
  const ref = artifactSourcePath(artifact);
  const fitForAssembly = artifact.isValidated;
  const showCopy =
    Boolean(onCopyPlainText) && artifact.artifactType === "Draft Section";

  return (
    <Card className="flex h-full flex-col gap-3 p-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-ink-subtle">
            {artifact.artifactType}
          </p>
          <h3 className="mt-1 text-sm font-semibold leading-snug text-ink">
            {artifact.title}
          </h3>
          {artifact.notes ? (
            <p className="mt-2 text-xs leading-relaxed text-ink-muted">
              {artifact.notes}
            </p>
          ) : null}
        </div>
        <div className="flex flex-col items-end gap-1">
          <OutputStatusBadge status={artifact.status} />
          <span
            className={
              fitForAssembly
                ? "text-[10px] font-semibold text-emerald-800"
                : "text-[10px] font-medium text-amber-900"
            }
          >
            {fitForAssembly
              ? "Packaging threshold met"
              : "Below packaging threshold"}
          </span>
        </div>
      </div>

      <dl className="grid gap-1 text-[11px] text-ink-muted">
        <div className="flex flex-wrap gap-x-2">
          <dt className="text-ink-subtle">Source entity</dt>
          <dd className="font-medium text-ink">
            {artifact.sourceEntityType.replace(/_/g, " ")}
          </dd>
        </div>
        <div className="flex flex-wrap gap-x-2">
          <dt className="text-ink-subtle">Required for submission</dt>
          <dd className="font-medium text-ink">
            {artifact.requiredForSubmission ? "Yes" : "No"}
          </dd>
        </div>
        <div className="flex flex-wrap gap-x-2">
          <dt className="text-ink-subtle">Last updated</dt>
          <dd className="tabular-nums text-ink">
            {formatUpdated(artifact.updatedAt)}
          </dd>
        </div>
      </dl>

      <div className="mt-auto flex flex-wrap gap-2 border-t border-border/60 pt-3">
        {ref ? (
          <Link
            to={ref.to}
            className="inline-flex items-center text-xs font-semibold text-ink underline-offset-2 hover:underline"
          >
            Open source artifact →
          </Link>
        ) : null}
        {showCopy ? (
          <Button
            type="button"
            variant="secondary"
            className="text-xs"
            onClick={() => void onCopyPlainText?.()}
          >
            Copy clean text
          </Button>
        ) : null}
      </div>
    </Card>
  );
}
