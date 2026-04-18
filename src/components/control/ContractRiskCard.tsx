import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import type { ContractRiskSeverity } from "@/types";

function severityVariant(
  s: ContractRiskSeverity,
): "muted" | "neutral" | "warning" | "emphasis" {
  if (s === "Critical") return "emphasis";
  if (s === "High") return "warning";
  if (s === "Moderate") return "neutral";
  return "muted";
}

export function ContractRiskCard({
  category,
  description,
  severity,
}: {
  category: string;
  description: string;
  severity: ContractRiskSeverity;
}) {
  return (
    <Card className="space-y-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-sm font-semibold text-ink">{category}</h3>
        <Badge variant={severityVariant(severity)}>{severity}</Badge>
      </div>
      <p className="text-sm leading-relaxed text-ink-muted">{description}</p>
    </Card>
  );
}
