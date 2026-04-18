import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { formatRecordDate } from "@/lib/display-format";
import type { Project } from "@/types";

type ProjectSummaryCardProps = {
  project: Project;
  totalFiles: number;
  filesNeedingReview: number;
  processedFiles: number;
};

export function ProjectSummaryCard({
  project,
  totalFiles,
  filesNeedingReview,
  processedFiles,
}: ProjectSummaryCardProps) {
  return (
    <Card className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 space-y-1">
          <p className="text-xs font-semibold uppercase tracking-wider text-ink-subtle">
            Workspace
          </p>
          <h2 className="text-xl font-semibold tracking-tight text-ink">
            {project.title}
          </h2>
          <p className="text-sm text-ink-muted">{project.shortDescription}</p>
        </div>
        <Badge variant="emphasis" className="shrink-0">
          {project.status}
        </Badge>
      </div>

      <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <dt className="text-xs font-medium uppercase tracking-wider text-ink-subtle">
            Bid number
          </dt>
          <dd className="mt-1 font-mono text-sm text-ink">{project.bidNumber}</dd>
        </div>
        <div>
          <dt className="text-xs font-medium uppercase tracking-wider text-ink-subtle">
            Issuing organization
          </dt>
          <dd className="mt-1 text-sm text-ink">{project.issuingOrganization}</dd>
        </div>
        <div>
          <dt className="text-xs font-medium uppercase tracking-wider text-ink-subtle">
            Response due
          </dt>
          <dd className="mt-1 text-sm text-ink">
            {formatRecordDate(project.dueDate)}
          </dd>
        </div>
        <div>
          <dt className="text-xs font-medium uppercase tracking-wider text-ink-subtle">
            Library
          </dt>
          <dd className="mt-1 text-sm text-ink">
            {totalFiles} files · {processedFiles} processed ·{" "}
            <span className="font-medium">
              {filesNeedingReview} need review
            </span>
          </dd>
        </div>
      </dl>
    </Card>
  );
}
