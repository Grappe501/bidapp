import type { DraftFeedbackAction } from "@/lib/drafting-utils";

type FeedbackRecommendationListProps = {
  actions: DraftFeedbackAction[];
};

export function FeedbackRecommendationList({
  actions,
}: FeedbackRecommendationListProps) {
  if (actions.length === 0) return null;

  return (
    <div className="rounded-lg border border-zinc-200/90 bg-white px-4 py-3 text-xs">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-ink-subtle">
        Recommended next steps
      </p>
      <ol className="mt-2 space-y-2.5">
        {actions.map((a, i) => (
          <li key={a.title} className="flex gap-2 leading-relaxed text-ink-muted">
            <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-zinc-200 bg-zinc-50 text-[10px] font-semibold text-ink">
              {i + 1}
            </span>
            <span>
              <span className="font-medium text-ink">{a.title}.</span> {a.detail}
            </span>
          </li>
        ))}
      </ol>
    </div>
  );
}
