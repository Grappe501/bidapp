import { Card } from "@/components/ui/Card";
import type { GroundedProseReviewResult } from "@/types";

type ProseReviewPanelProps = {
  review: GroundedProseReviewResult | null;
};

function Pill({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-md border border-zinc-200/90 bg-white px-2.5 py-1.5">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-ink-subtle">
        {label}
      </p>
      <p className="mt-0.5 text-xs font-medium capitalize text-ink">{value}</p>
    </div>
  );
}

export function ProseReviewPanel({ review }: ProseReviewPanelProps) {
  if (!review) {
    return (
      <div className="rounded-md border border-dashed border-zinc-300 bg-zinc-50/40 px-3 py-3 text-xs text-ink-muted">
        Run a grounded review to analyze this draft against requirements, evidence, vendor
        facts, and architecture context.
      </div>
    );
  }

  return (
    <Card className="space-y-4 p-4">
      <div>
        <h3 className="text-sm font-semibold text-ink">Grounded prose review</h3>
        <p className="mt-1 text-[11px] leading-relaxed text-ink-muted">
          Structured pass over your draft text and grounding bundle — citations are not
          invented beyond the inputs you supplied.
        </p>
      </div>

      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
        <Pill label="Clarity" value={review.clarity} />
        <Pill label="Technical density" value={review.technical_density} />
        <Pill label="Metrics presence" value={review.metrics_presence} />
        <Pill label="Confidence" value={review.confidence} />
      </div>

      {review.requirement_findings.length > 0 ? (
        <div className="space-y-2">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-ink-subtle">
            Requirement findings
          </p>
          <ul className="max-h-40 space-y-2 overflow-y-auto text-[11px]">
            {review.requirement_findings.map((f) => (
              <li
                key={f.requirement_id}
                className="rounded border border-border/80 bg-zinc-50/50 px-2.5 py-2"
              >
                <span className="font-mono text-[10px] text-ink-subtle">
                  {f.requirement_id.length > 20
                    ? `${f.requirement_id.slice(0, 18)}…`
                    : f.requirement_id}
                </span>
                <span className="mx-1.5 text-ink-subtle">·</span>
                <span className="font-medium capitalize text-ink">
                  {f.status.replace(/_/g, " ")}
                </span>
                <span className="mx-1.5 text-ink-subtle">·</span>
                <span className="capitalize text-ink-muted">
                  support: {f.support_level}
                </span>
                {f.notes ? (
                  <p className="mt-1 leading-snug text-ink-muted">{f.notes}</p>
                ) : null}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {review.unsupported_claims.length > 0 ? (
        <div className="space-y-2">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-ink-subtle">
            Unsupported claims
          </p>
          <ul className="space-y-2 text-[11px]">
            {review.unsupported_claims.map((u) => (
              <li
                key={u.text.slice(0, 40)}
                className="rounded border border-amber-200/70 bg-amber-50/30 px-2.5 py-2 text-amber-950/90"
              >
                <p className="font-medium text-ink">{u.text}</p>
                <p className="mt-1 text-ink-muted">{u.reason}</p>
                {u.suggested_fix ? (
                  <p className="mt-1 text-ink">
                    <span className="font-medium">Suggestion:</span> {u.suggested_fix}
                  </p>
                ) : null}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {review.improvement_actions.length > 0 ? (
        <div className="space-y-2 border-t border-border/60 pt-3">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-ink-subtle">
            Improvement actions
          </p>
          <ul className="list-inside list-disc space-y-1 text-[11px] text-ink-muted">
            {review.improvement_actions.map((a) => (
              <li key={a.slice(0, 48)}>{a}</li>
            ))}
          </ul>
        </div>
      ) : null}
    </Card>
  );
}
