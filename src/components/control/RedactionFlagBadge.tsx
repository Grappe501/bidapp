import { Badge } from "@/components/ui/Badge";
import type { RedactionFlagStatus } from "@/types";

function variantFor(status: RedactionFlagStatus): "muted" | "neutral" | "warning" | "emphasis" {
  if (status === "Open") return "warning";
  if (status === "Under Review") return "neutral";
  return "muted";
}

export function RedactionFlagBadge({ status }: { status: RedactionFlagStatus }) {
  return (
    <Badge variant={variantFor(status)} className="font-normal">
      {status}
    </Badge>
  );
}
