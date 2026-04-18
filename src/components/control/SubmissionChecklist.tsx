import { SubmissionItemCard } from "@/components/control/SubmissionItemCard";
import type { SubmissionItem } from "@/types";

type SubmissionChecklistProps = {
  items: SubmissionItem[];
  onUpdate: (id: string, patch: Partial<SubmissionItem>) => void;
};

export function SubmissionChecklist({ items, onUpdate }: SubmissionChecklistProps) {
  const proposal = items.filter((i) => i.phase === "Proposal");
  const discussion = items.filter((i) => i.phase === "Discussion");

  return (
    <div className="space-y-8">
      <section className="space-y-3">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-ink-subtle">
          Proposal package
        </h2>
        <div className="space-y-4">
          {proposal.map((item) => (
            <SubmissionItemCard
              key={item.id}
              item={item}
              onChange={(patch) => onUpdate(item.id, patch)}
            />
          ))}
        </div>
      </section>

      {discussion.length > 0 ? (
        <section className="space-y-3">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-ink-subtle">
            Discussion phase
          </h2>
          <div className="space-y-4">
            {discussion.map((item) => (
              <SubmissionItemCard
                key={item.id}
                item={item}
                onChange={(patch) => onUpdate(item.id, patch)}
              />
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
