import { Card } from "@/components/ui/Card";

export function PositioningAngleCard({
  title,
  body,
  kicker,
}: {
  title: string;
  body: string;
  kicker?: string;
}) {
  return (
    <Card className="p-4">
      {kicker ? (
        <p className="text-[10px] font-medium uppercase tracking-wide text-ink-subtle">
          {kicker}
        </p>
      ) : null}
      <h3 className="text-sm font-semibold text-ink">{title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-ink-muted">{body}</p>
    </Card>
  );
}
