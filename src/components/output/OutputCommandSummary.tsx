import type { OutputSummary } from "@/lib/output-utils";
import { issueSummary } from "@/lib/review-utils";
import type { ReadinessScore, ReviewIssue } from "@/types";

type OutputCommandSummaryProps = {
  summary: OutputSummary;
  readiness: ReadinessScore;
  reviewIssues: ReviewIssue[];
  submissionPackageComplete: boolean;
  clientPacketComplete: boolean;
  redactionUnresolved: number;
  finalBundleComplete: boolean;
};

function toneLine(input: {
  summary: OutputSummary;
  critical: number;
  submissionPackageComplete: boolean;
  redactionUnresolved: number;
  readinessOverall: number;
}): { headline: string; subline: string } {
  const { summary, critical, submissionPackageComplete, redactionUnresolved } =
    input;

  if (critical > 0 || summary.outputBlockers > 2) {
    return {
      headline: "Finish line needs focused work",
      subline:
        "Critical review issues or required artifacts are still open — resolve blockers before treating any packet as final.",
    };
  }

  if (!submissionPackageComplete || summary.outputBlockers > 0) {
    return {
      headline: "Packaging is not fully submission-ready",
      subline:
        "The submission package or required artifacts still have gaps. Client and redacted handoffs should wait until core assembly validates.",
    };
  }

  if (redactionUnresolved > 0) {
    return {
      headline: "Submission path is clearer; redaction still open",
      subline:
        "Assembly may be advancing, but redaction-sensitive items need clearance before a public or client-safe packet.",
    };
  }

  if (input.readinessOverall < 72) {
    return {
      headline: "Outputs look packaged; bid readiness is moderate",
      subline:
        "Packaging thresholds may pass while overall readiness still warrants review — confirm scoring and coverage before go / no-go.",
    };
  }

  return {
    headline: "Outputs are in strong shape for final decisions",
    subline:
      "No major packaging blockers surfaced here — still run human compliance and legal review before external release.",
  };
}

export function OutputCommandSummary({
  summary,
  readiness,
  reviewIssues,
  submissionPackageComplete,
  clientPacketComplete,
  redactionUnresolved,
  finalBundleComplete,
}: OutputCommandSummaryProps) {
  const iss = issueSummary(reviewIssues);
  const { headline, subline } = toneLine({
    summary,
    critical: iss.critical,
    submissionPackageComplete,
    redactionUnresolved,
    readinessOverall: readiness.overall,
  });

  const stripBits = [
    {
      label: "Submission package",
      ok: submissionPackageComplete && summary.outputBlockers === 0,
      hint: submissionPackageComplete ? "Thresholds met" : "Gaps remain",
    },
    {
      label: "Client review packet",
      ok: clientPacketComplete && iss.critical === 0,
      hint: clientPacketComplete ? "Assembled" : "Incomplete",
    },
    {
      label: "Redacted packet",
      ok: redactionUnresolved === 0,
      hint:
        redactionUnresolved === 0
          ? "No open items"
          : `${redactionUnresolved} open`,
    },
    {
      label: "Final readiness bundle",
      ok: finalBundleComplete && readiness.overall >= 68,
      hint: finalBundleComplete ? "Tracked" : "Gaps remain",
    },
  ];

  return (
    <div className="rounded-xl border border-zinc-200/90 bg-gradient-to-b from-zinc-50/80 to-white px-5 py-5 shadow-sm">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-ink-subtle">
        At a glance
      </p>
      <h2 className="mt-2 text-lg font-semibold leading-snug text-ink">
        {headline}
      </h2>
      <p className="mt-2 max-w-3xl text-sm leading-relaxed text-ink-muted">
        {subline}
      </p>
      <dl className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {stripBits.map((b) => (
          <div
            key={b.label}
            className="rounded-lg border border-border/80 bg-white/90 px-3 py-2.5"
          >
            <dt className="text-[11px] font-medium text-ink">{b.label}</dt>
            <dd className="mt-1 flex items-center gap-2 text-xs text-ink-muted">
              <span
                className={
                  b.ok
                    ? "font-semibold text-emerald-800"
                    : "font-semibold text-amber-900"
                }
              >
                {b.ok ? "On track" : "Needs attention"}
              </span>
              <span className="text-ink-subtle">· {b.hint}</span>
            </dd>
          </div>
        ))}
      </dl>
      <p className="mt-4 border-t border-border/60 pt-3 text-[11px] text-ink-subtle">
        Critical review issues:{" "}
        <span className="font-semibold text-ink">{iss.critical}</span>
        {" · "}
        Output blockers (required / submission gaps):{" "}
        <span className="font-semibold text-ink">{summary.outputBlockers}</span>
        {" · "}
        Open redaction items:{" "}
        <span className="font-semibold text-ink">
          {summary.redactionSensitiveCount}
        </span>
        {" · "}
        Readiness overall:{" "}
        <span className="font-semibold tabular-nums text-ink">
          {readiness.overall}
        </span>
        /100
      </p>
    </div>
  );
}
