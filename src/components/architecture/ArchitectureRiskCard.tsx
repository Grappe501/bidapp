import { Card } from "@/components/ui/Card";

type ArchitectureRiskCardProps = {
  risks: string[];
};

export function ArchitectureRiskCard({ risks }: ArchitectureRiskCardProps) {
  return (
    <Card className="space-y-3">
      <h3 className="text-sm font-semibold text-ink">Implementation risks</h3>
      {risks.length === 0 ? (
        <p className="text-sm text-ink-muted">None listed.</p>
      ) : (
        <ul className="space-y-2">
          {risks.map((r, i) => (
            <li
              key={i}
              className="border-l-2 border-amber-300/90 pl-3 text-sm leading-relaxed text-ink"
            >
              {r}
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
