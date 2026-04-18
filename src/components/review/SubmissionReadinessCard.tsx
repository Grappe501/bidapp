import { Card } from "@/components/ui/Card";
import type { BidReviewSnapshot } from "@/lib/review-rules-engine";

const OK = new Set(["Ready", "Validated", "Submitted"]);

type SubmissionReadinessCardProps = {
  snapshot: BidReviewSnapshot | null;
};

export function SubmissionReadinessCard({ snapshot }: SubmissionReadinessCardProps) {
  if (!snapshot) {
    return (
      <Card className="p-4 text-sm text-ink-muted">No snapshot loaded.</Card>
    );
  }

  const req = snapshot.submissionItems.filter((s) => s.required);
  const gaps = req.filter((s) => !OK.has(s.status));

  return (
    <Card className="space-y-3 p-4">
      <h2 className="text-sm font-semibold text-ink">Submission packet</h2>
      <p className="text-xs text-ink-muted">
        Required items not yet Ready / Validated / Submitted.
      </p>
      {gaps.length === 0 ? (
        <p className="text-sm text-ink-muted">
          All required checklist rows show green-path statuses.
        </p>
      ) : (
        <ul className="space-y-2 text-sm">
          {gaps.map((s) => (
            <li
              key={s.id}
              className="rounded-md border border-border px-3 py-2"
            >
              <span className="font-medium text-ink">{s.name}</span>
              <span className="mt-1 block text-xs text-ink-muted">
                {s.status} · {s.owner}
              </span>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
