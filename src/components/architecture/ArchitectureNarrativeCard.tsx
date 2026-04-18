import { Card } from "@/components/ui/Card";

type ArchitectureNarrativeCardProps = {
  title?: string;
  items: string[];
};

export function ArchitectureNarrativeCard({
  title = "Narrative strengths",
  items,
}: ArchitectureNarrativeCardProps) {
  return (
    <Card className="space-y-3">
      <h3 className="text-sm font-semibold text-ink">{title}</h3>
      {items.length === 0 ? (
        <p className="text-sm text-ink-muted">None listed.</p>
      ) : (
        <ul className="list-inside list-disc space-y-2 text-sm text-ink-muted marker:text-zinc-400">
          {items.map((item, i) => (
            <li key={i} className="leading-relaxed">
              <span className="text-ink">{item}</span>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
