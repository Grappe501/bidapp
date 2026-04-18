import { Link } from "react-router-dom";
import { Card } from "@/components/ui/Card";
import { activeIssues } from "@/lib/review-utils";
import type { ReviewIssue } from "@/types";

function trimDetail(text: string, max = 160): string {
  const t = text.replace(/\s+/g, " ").trim();
  if (t.length <= max) return t;
  return `${t.slice(0, max).trim()}…`;
}

export function ClientRiskSnapshot({
  issues,
  fallbackWatchouts,
}: {
  issues: ReviewIssue[];
  /** When few issues exist, show these strings instead of empty */
  fallbackWatchouts: string[];
}) {
  const act = activeIssues(issues);
  const ranked = [...act].sort((a, b) => {
    const o = (s: string) =>
      s === "Critical" ? 0 : s === "High" ? 1 : s === "Moderate" ? 2 : 3;
    return o(a.severity) - o(b.severity);
  });

  const lines: { title: string; detail?: string; issueId?: string }[] = [];
  for (const i of ranked) {
    if (lines.length >= 5) break;
    if (
      i.severity === "Low" &&
      i.issueType !== "Submission Gap" &&
      i.issueType !== "Unsupported Claim"
    ) {
      continue;
    }
    lines.push({
      title: i.title,
      detail: trimDetail(i.description || i.suggestedFix),
      issueId: i.id,
    });
  }

  if (lines.length === 0) {
    return (
      <div className="space-y-2">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-ink-subtle">
          Top risks & watchouts
        </h2>
        <Card className="p-5">
          <ul className="space-y-3 text-sm text-ink">
            {fallbackWatchouts.map((w, i) => (
              <li key={i} className="flex gap-2 leading-snug">
                <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-amber-500/90" />
                <span>{w}</span>
              </li>
            ))}
          </ul>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <h2 className="text-xs font-semibold uppercase tracking-wide text-ink-subtle">
        Top risks & watchouts
      </h2>
      <p className="max-w-3xl text-xs leading-relaxed text-ink-muted">
        Focused client-facing watchouts from active review findings — strongest
        defensibility and submission risks first.
      </p>
      <Card className="divide-y divide-border/60 p-0">
        {lines.map((l, idx) => (
          <div key={l.issueId ?? idx} className="px-5 py-4">
            <p className="text-sm font-medium text-ink">{l.title}</p>
            {l.detail ? (
              <p className="mt-1.5 text-xs leading-relaxed text-ink-muted">
                {l.detail}
              </p>
            ) : null}
            {l.issueId ? (
              <Link
                to={`/review/issues/${l.issueId}`}
                className="mt-2 inline-block text-xs font-semibold text-ink underline-offset-2 hover:underline"
              >
                View finding →
              </Link>
            ) : null}
          </div>
        ))}
      </Card>
    </div>
  );
}
