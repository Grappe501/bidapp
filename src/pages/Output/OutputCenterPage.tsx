import { Link } from "react-router-dom";
import { OutputBundleCard } from "@/components/output/OutputBundleCard";
import { OutputSubNav } from "@/components/output/OutputSubNav";
import { Card } from "@/components/ui/Card";
import { useOutput } from "@/context/useOutput";
import { bundleArtifactIds } from "@/lib/output-utils";
import { activeIssues } from "@/lib/review-utils";

export function OutputCenterPage() {
  const { bundles, packagingByBundle, summary, artifacts, reviewIssues } =
    useOutput();
  const act = activeIssues(reviewIssues);
  const criticalDrafts = act.filter((i) => i.issueType === "Page Limit Risk");

  const weakSections = artifacts.filter(
    (a) =>
      a.artifactType === "Draft Section" &&
      !a.isValidated &&
      ["Experience", "Solution", "Risk"].includes(a.notes),
  );

  return (
    <div className="p-8">
      <div className="mx-auto max-w-5xl space-y-8">
        <OutputSubNav />

        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-ink">
            Output command center
          </h1>
          <p className="mt-2 max-w-3xl text-sm leading-relaxed text-ink-muted">
            Assemble submission materials, client review packets, and redaction
            support — disciplined handoff without ARBuy automation.
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Card className="p-4">
            <p className="text-xs font-medium text-ink-subtle">Artifacts tracked</p>
            <p className="mt-1 text-2xl font-semibold tabular-nums text-ink">
              {summary.totalArtifacts}
            </p>
          </Card>
          <Card className="p-4">
            <p className="text-xs font-medium text-ink-subtle">Ready / validated</p>
            <p className="mt-1 text-2xl font-semibold tabular-nums text-ink">
              {summary.readyArtifacts + summary.validatedArtifacts}
            </p>
          </Card>
          <Card className="p-4">
            <p className="text-xs font-medium text-ink-subtle">Redaction-sensitive</p>
            <p className="mt-1 text-2xl font-semibold tabular-nums text-ink">
              {summary.redactionSensitiveCount}
            </p>
          </Card>
          <Card className="p-4">
            <p className="text-xs font-medium text-ink-subtle">Output blockers</p>
            <p className="mt-1 text-2xl font-semibold tabular-nums text-ink">
              {summary.outputBlockers}
            </p>
          </Card>
        </div>

        <div>
          <h2 className="text-sm font-semibold text-ink">Bundles</h2>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            {bundles.map((b) => (
              <OutputBundleCard
                key={b.id}
                bundle={b}
                completeness={packagingByBundle[b.id]}
              />
            ))}
          </div>
        </div>

        <div>
          <h2 className="text-sm font-semibold text-ink">Quick actions</h2>
          <ul className="mt-3 space-y-2 text-sm">
            <li>
              <Link
                to="/review/issues"
                className="text-ink underline-offset-2 hover:underline"
              >
                Open critical issues
              </Link>
              <span className="text-ink-muted">
                {" "}
                ({act.filter((i) => i.severity === "Critical").length} active)
              </span>
            </li>
            <li>
              <Link
                to="/output/submission"
                className="text-ink underline-offset-2 hover:underline"
              >
                Submission package workspace
              </Link>
            </li>
            <li>
              <Link
                to="/drafts"
                className="text-ink underline-offset-2 hover:underline"
              >
                Drafts over page limit
              </Link>
              <span className="text-ink-muted"> ({criticalDrafts.length} flags)</span>
            </li>
            <li>
              <span className="text-ink-muted">Weakly grounded sections: </span>
              {weakSections.length ? (
                <span className="text-ink">{weakSections.map((w) => w.notes).join(", ")}</span>
              ) : (
                <span className="text-ink-muted">none surfaced</span>
              )}
            </li>
          </ul>
        </div>

        <p className="text-xs text-ink-subtle">
          Submission package currently tracks{" "}
          {bundleArtifactIds("Submission Package", artifacts).length} linked artifacts.
        </p>
      </div>
    </div>
  );
}
