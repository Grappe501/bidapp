import { cn } from "@/lib/utils";

const styles = {
  high: "bg-emerald-50 text-emerald-900 ring-emerald-200",
  medium: "bg-amber-50 text-amber-900 ring-amber-200",
  low: "bg-rose-50 text-rose-900 ring-rose-200",
} as const;

export function AgentConfidenceBadge({
  confidence,
}: {
  confidence: "high" | "medium" | "low";
}) {
  const label =
    confidence === "high"
      ? "High confidence"
      : confidence === "medium"
        ? "Medium confidence"
        : "Low confidence";
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset",
        styles[confidence],
      )}
    >
      {label}
    </span>
  );
}
