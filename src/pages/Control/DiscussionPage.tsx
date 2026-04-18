import { BidControlNav } from "@/components/control/BidControlNav";
import { DiscussionDeliverableCard } from "@/components/control/DiscussionDeliverableCard";
import { DiscussionTracker } from "@/components/control/DiscussionTracker";
import { Card } from "@/components/ui/Card";
import { useControl } from "@/context/useControl";

export function DiscussionPage() {
  const { discussionItems, updateDiscussionItem } = useControl();

  return (
    <div className="p-8">
      <div className="mx-auto max-w-4xl space-y-8">
        <BidControlNav />

        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-ink">
            Discussion-phase preparation
          </h1>
          <p className="mt-2 max-w-3xl text-sm leading-relaxed text-ink-muted">
            Post-submission deliverables often become contract artifacts. Align
            owners and readiness now so oral defense and award negotiation do not
            fork the story told in Experience, Solution, and Risk.
          </p>
        </div>

        <DiscussionTracker items={discussionItems} />

        <Card className="border-dashed border-zinc-300 bg-zinc-50/50 px-4 py-3 text-sm text-ink-muted">
          Seeded set mirrors typical DHS discussion requests (SOW, risk plan,
          payment schedule, reporting templates). Expand in session as the
          solicitation clarifies.
        </Card>

        <div className="space-y-4">
          {discussionItems.map((item) => (
            <DiscussionDeliverableCard
              key={item.id}
              item={item}
              onChange={(patch) => updateDiscussionItem(item.id, patch)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
