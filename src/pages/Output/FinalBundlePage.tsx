import { ExportActionBar } from "@/components/output/ExportActionBar";
import { FinalReadinessBundleCard } from "@/components/output/FinalReadinessBundleCard";
import { OutputSubNav } from "@/components/output/OutputSubNav";
import { ReadinessScoreCard } from "@/components/review/ReadinessScoreCard";
import { Card } from "@/components/ui/Card";
import { Link } from "react-router-dom";
import { useOutput } from "@/context/useOutput";
import { activeIssues } from "@/lib/review-utils";

export function FinalBundlePage() {
  const {
    readiness,
    reviewIssues,
    summary,
    redactionSummary,
    copyReadinessSummary,
    bundles,
    copyBundleJson,
    artifacts,
  } = useOutput();

  const act = activeIssues(reviewIssues);
  const critical = act.filter((i) => i.severity === "Critical");
  const topRisks = act
    .filter((i) => i.issueType === "Contract Exposure" || i.severity === "High")
    .slice(0, 5);

  const missingRequired = artifacts.filter(
    (a) => a.requiredForSubmission && !a.isValidated,
  );

  const critTitles = critical.map((i) => i.title);
  const missingTitles = missingRequired.map((a) => a.title);

  const clientSignOffReady =
    critical.length === 0 && readiness.overall >= 68 && summary.outputBlockers <= 2;

  const submissionAssemblyReady =
    summary.outputBlockers === 0 &&
    redactionSummary.unresolvedCount === 0 &&
    redactionSummary.redactedCopyArtifactReady;

  const blockedReasons: string[] = [];
  if (critical.length) {
    blockedReasons.push(
      `${critical.length} critical review item(s) still open — resolve before sign-off.`,
    );
  }
  if (summary.outputBlockers > 0) {
    blockedReasons.push(
      `${summary.outputBlockers} output blocker(s) from submission readiness and gaps.`,
    );
  }
  if (redactionSummary.unresolvedCount > 0) {
    blockedReasons.push("Redaction flags still open or under review.");
  }
  if (!redactionSummary.redactedCopyArtifactReady) {
    blockedReasons.push("Redacted copy artifact is not validated.");
  }

  const finalBundle = bundles.find((b) => b.bundleType === "Final Readiness Bundle");

  const dimensions: {
    key: keyof typeof readiness;
    label: string;
    hint: string;
  }[] = [
    { key: "overall", label: "Overall", hint: "Weighted composite from BP-007." },
    { key: "submission", label: "Submission", hint: "Required items and gates." },
    { key: "coverage", label: "Coverage", hint: "Mandatory requirement posture." },
    { key: "grounding", label: "Grounding", hint: "Evidence-linked drafts." },
    {
      key: "scoring_alignment",
      label: "Scoring alignment",
      hint: "Volumes and page discipline.",
    },
    {
      key: "contract_readiness",
      label: "Contract readiness",
      hint: "Exposure and architecture claims.",
    },
    {
      key: "discussion_readiness",
      label: "Discussion readiness",
      hint: "Workbook and negotiation prep.",
    },
  ];

  return (
    <div className="p-8">
      <div className="mx-auto max-w-5xl space-y-8">
        <OutputSubNav />

        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-ink">
            Final readiness bundle
          </h1>
          <p className="mt-2 max-w-3xl text-sm leading-relaxed text-ink-muted">
            Executive go / no-go: readiness from review, submission blockers, and
            redaction posture — in one calm surface.
          </p>
        </div>

        <FinalReadinessBundleCard
          readiness={readiness}
          clientSignOffReady={clientSignOffReady}
          submissionAssemblyReady={submissionAssemblyReady}
          blockedReasons={
            clientSignOffReady && submissionAssemblyReady ? [] : blockedReasons
          }
        />

        <ExportActionBar
          actions={[
            { label: "Copy readiness summary", onClick: copyReadinessSummary },
            ...(finalBundle
              ? [
                  {
                    label: "Copy final bundle (JSON)",
                    onClick: () => copyBundleJson(finalBundle.id),
                  },
                ]
              : []),
          ]}
        />

        <div>
          <h2 className="text-sm font-semibold text-ink">Readiness dimensions</h2>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            {dimensions.map(({ key, label, hint }) => (
              <ReadinessScoreCard
                key={key}
                label={label}
                value={readiness[key]}
                explanation={hint}
              />
            ))}
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <Card className="p-4">
            <h2 className="text-sm font-semibold text-ink">Critical unresolved</h2>
            {critTitles.length ? (
              <ul className="mt-3 list-inside list-disc space-y-1 text-xs text-ink-muted">
                {critical.map((i) => (
                  <li key={i.id}>
                    <Link
                      to={`/review/issues/${encodeURIComponent(i.id)}`}
                      className="text-ink underline-offset-2 hover:underline"
                    >
                      {i.title}
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-3 text-xs text-ink-muted">None open.</p>
            )}
          </Card>
          <Card className="p-4">
            <h2 className="text-sm font-semibold text-ink">Required missing / not validated</h2>
            {missingTitles.length ? (
              <ul className="mt-3 list-inside list-disc space-y-1 text-xs text-ink-muted">
                {missingRequired.slice(0, 8).map((a) => (
                  <li key={a.id}>{a.title}</li>
                ))}
              </ul>
            ) : (
              <p className="mt-3 text-xs text-ink-muted">
                All required artifacts show validated or in-flight status.
              </p>
            )}
          </Card>
        </div>

        <Card className="p-4">
          <h2 className="text-sm font-semibold text-ink">Top risks (active review)</h2>
          {topRisks.length ? (
            <ul className="mt-3 space-y-2 text-xs text-ink-muted">
              {topRisks.map((i) => (
                <li key={i.id}>
                  <span className="font-medium text-ink">{i.issueType}</span>
                  {": "}
                  {i.title}
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-3 text-xs text-ink-muted">
              No high-severity contract or scoring flags in the active queue.
            </p>
          )}
        </Card>

        <Card className="p-4">
          <h2 className="text-sm font-semibold text-ink">Recommended next actions</h2>
          <ol className="mt-3 list-inside list-decimal space-y-2 text-xs text-ink-muted">
            <li>Clear or dismiss review items tied to submission gaps.</li>
            <li>Validate price sheet, subcontractors form, and redacted copy in bid control.</li>
            <li>Run a final red-team refresh after substantive draft edits.</li>
            <li>Package PDFs and forms manually; use JSON export only for internal QA.</li>
          </ol>
        </Card>
      </div>
    </div>
  );
}
