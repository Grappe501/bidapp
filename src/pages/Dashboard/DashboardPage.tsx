import { useMemo } from "react";
import { Card } from "@/components/ui/Card";
import { useWorkspace } from "@/context/useWorkspace";
import { useDbProjects } from "@/hooks/useDbProjects";
import { ActivityCard } from "@/components/workspace/ActivityCard";
import { CoverageSnapshotCard } from "@/components/workspace/CoverageSnapshotCard";
import { DeadlineCard } from "@/components/workspace/DeadlineCard";
import { ProjectSummaryCard } from "@/components/workspace/ProjectSummaryCard";
import { FILE_CATEGORIES } from "@/types";

export function DashboardPage() {
  const { project, files } = useWorkspace();
  const { projects: dbProjects, loading: dbLoading, error: dbError, functionsEnabled } =
    useDbProjects();

  const {
    totalFiles,
    filesNeedingReview,
    processedFiles,
    distribution,
    recentFiles,
  } = useMemo(() => {
    const total = files.length;
    const needsReview = files.filter((f) => f.status === "Needs Review").length;
    const processed = files.filter((f) => f.status === "Processed").length;
    const dist = FILE_CATEGORIES.map((category) => ({
      category,
      count: files.filter((f) => f.category === category).length,
    })).filter((d) => d.count > 0);
    const recent = [...files]
      .sort(
        (a, b) =>
          new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime(),
      )
      .slice(0, 5);

    return {
      totalFiles: total,
      filesNeedingReview: needsReview,
      processedFiles: processed,
      distribution: dist,
      recentFiles: recent,
    };
  }, [files]);

  return (
    <div className="p-8">
      <div className="mx-auto max-w-6xl space-y-8">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-ink">
            Workspace overview
          </h1>
          <p className="mt-1 text-sm text-ink-muted">
            Operational snapshot for the active bid. Requirements and evidence
            linking follow in the next phase.
          </p>
        </div>

        <ProjectSummaryCard
          project={project}
          totalFiles={totalFiles}
          filesNeedingReview={filesNeedingReview}
          processedFiles={processedFiles}
        />

        {functionsEnabled ? (
          <Card className="space-y-2 border-zinc-200 bg-zinc-50/80 px-4 py-3">
            <h2 className="text-sm font-semibold text-ink">
              Database project check (list-projects)
            </h2>
            {dbLoading ? (
              <p className="text-sm text-ink-muted">Loading from Postgres…</p>
            ) : dbError ? (
              <p className="text-sm text-amber-900/90">{dbError}</p>
            ) : dbProjects && dbProjects.length > 0 ? (
              <ul className="list-inside list-disc space-y-1 text-sm text-ink-muted">
                {dbProjects.map((p) => (
                  <li key={p.id}>
                    <span className="font-medium text-ink">{p.bidNumber}</span> —{" "}
                    {p.title}
                    <span className="ml-2 text-xs text-ink-subtle">({p.id})</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-ink-muted">
                No rows yet — run{" "}
                <code className="rounded bg-zinc-100 px-1">npm run db:migrate</code>{" "}
                and{" "}
                <code className="rounded bg-zinc-100 px-1">npm run db:seed</code>.
              </p>
            )}
          </Card>
        ) : null}

        <div className="grid gap-6 lg:grid-cols-2">
          <DeadlineCard dueDateIso={project.dueDate} />
          <CoverageSnapshotCard
            distribution={distribution}
            totalFiles={totalFiles}
          />
        </div>

        <ActivityCard recentFiles={recentFiles} />
      </div>
    </div>
  );
}
