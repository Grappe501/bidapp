import { Link } from "react-router-dom";
import { Card } from "@/components/ui/Card";
import type { ArchitectureOption, ReadinessScore, Vendor } from "@/types";

export function ClientReviewSummaryCard({
  bidNumber,
  projectTitle,
  readiness,
  recommendedOption,
  primaryVendors,
  submissionProgressLabel,
  majorRiskTeaser,
}: {
  bidNumber: string;
  projectTitle: string;
  readiness: ReadinessScore;
  recommendedOption: ArchitectureOption | undefined;
  primaryVendors: Vendor[];
  submissionProgressLabel: string;
  majorRiskTeaser: string;
}) {
  return (
    <Card className="p-6">
      <p className="text-xs font-medium uppercase tracking-wide text-ink-subtle">
        Client review briefing
      </p>
      <h1 className="mt-2 text-xl font-semibold tracking-tight text-ink">
        {bidNumber}
      </h1>
      <p className="mt-1 text-sm text-ink-muted">{projectTitle}</p>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <div>
          <p className="text-xs font-medium text-ink-subtle">Readiness (composite)</p>
          <p className="mt-1 text-3xl font-semibold tabular-nums text-ink">
            {readiness.overall}
          </p>
          <Link
            to="/review/readiness"
            className="mt-1 inline-block text-xs text-ink underline-offset-2 hover:underline"
          >
            Full readiness model →
          </Link>
        </div>
        <div>
          <p className="text-xs font-medium text-ink-subtle">Submission posture</p>
          <p className="mt-1 text-sm text-ink">{submissionProgressLabel}</p>
        </div>
      </div>

      <div className="mt-6 border-t border-border pt-6">
        <p className="text-xs font-medium text-ink-subtle">Recommended architecture</p>
        <p className="mt-1 text-sm font-medium text-ink">
          {recommendedOption?.name ?? "Not selected"}
        </p>
        {recommendedOption?.summary ? (
          <p className="mt-2 text-xs leading-relaxed text-ink-muted">
            {recommendedOption.summary}
          </p>
        ) : null}
        <Link
          to="/architecture"
          className="mt-2 inline-block text-xs text-ink underline-offset-2 hover:underline"
        >
          Architecture workspace →
        </Link>
      </div>

      <div className="mt-6 border-t border-border pt-6">
        <p className="text-xs font-medium text-ink-subtle">Primary platform partners</p>
        <ul className="mt-2 space-y-1 text-sm text-ink">
          {primaryVendors.slice(0, 4).map((v) => (
            <li key={v.id}>
              <Link
                to={`/vendors/${v.id}`}
                className="hover:underline"
              >
                {v.name}
              </Link>
              <span className="text-ink-muted"> — {v.status}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-6 rounded-md bg-zinc-50 px-4 py-3">
        <p className="text-xs font-medium text-ink-subtle">Major risk theme</p>
        <p className="mt-1 text-xs leading-relaxed text-ink">{majorRiskTeaser}</p>
      </div>
    </Card>
  );
}
