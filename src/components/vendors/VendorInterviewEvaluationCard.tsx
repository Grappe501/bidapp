import { Card } from "@/components/ui/Card";
import type { VendorInterviewWorkspaceRow } from "@/types";

function avgByCategory(rows: VendorInterviewWorkspaceRow[]): {
  category: string;
  avg: number;
  n: number;
}[] {
  const m = new Map<string, { sum: number; n: number }>();
  for (const r of rows) {
    const a = r.assessment;
    if (!a || a.score0To5 < 0) continue;
    const c = r.question.category || "other";
    const cur = m.get(c) ?? { sum: 0, n: 0 };
    cur.sum += a.score0To5;
    cur.n += 1;
    m.set(c, cur);
  }
  return [...m.entries()]
    .map(([category, v]) => ({
      category,
      avg: v.n > 0 ? v.sum / v.n : 0,
      n: v.n,
    }))
    .sort((a, b) => a.category.localeCompare(b.category));
}

export function VendorInterviewEvaluationCard(props: {
  rows: VendorInterviewWorkspaceRow[];
}) {
  const cats = avgByCategory(props.rows);
  const scored = props.rows.filter((r) => r.assessment && r.assessment.score0To5 >= 0);
  const trend =
    scored.length > 0
      ? scored.reduce((s, r) => s + (r.assessment?.score0To5 ?? 0), 0) /
        scored.length
      : null;

  return (
    <Card className="space-y-2 p-4">
      <h3 className="text-sm font-semibold text-ink">Evaluation snapshot</h3>
      <p className="text-xs text-ink-muted">
        Averages are from AI-assisted assessments — override by re-saving answers or
        re-running evaluation on the server.
      </p>
      <div className="text-xs">
        <span className="text-ink-subtle">Overall mean quality: </span>
        <span className="font-medium text-ink">
          {trend != null ? trend.toFixed(2) : "—"}
        </span>
      </div>
      {cats.length === 0 ? (
        <p className="text-xs text-ink-muted">No scored answers yet.</p>
      ) : (
        <ul className="space-y-1 text-xs">
          {cats.map((c) => (
            <li key={c.category} className="flex justify-between gap-2">
              <span className="text-ink-muted">{c.category}</span>
              <span className="text-ink">
                {c.avg.toFixed(2)} <span className="text-ink-subtle">({c.n})</span>
              </span>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
