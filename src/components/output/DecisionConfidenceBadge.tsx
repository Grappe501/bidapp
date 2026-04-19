import type { VendorDecisionSynthesis } from "@/types";

const STYLES: Record<VendorDecisionSynthesis["confidence"], string> = {
  high: "bg-emerald-100 text-emerald-950 ring-emerald-900/15",
  medium: "bg-amber-100 text-amber-950 ring-amber-900/15",
  low: "bg-rose-100 text-rose-950 ring-rose-900/15",
  provisional: "bg-slate-200 text-slate-900 ring-slate-500/20",
};

const LABELS: Record<VendorDecisionSynthesis["confidence"], string> = {
  high: "High confidence",
  medium: "Medium confidence",
  low: "Low confidence",
  provisional: "Provisional",
};

export function DecisionConfidenceBadge(props: {
  confidence: VendorDecisionSynthesis["confidence"];
  className?: string;
}) {
  const { confidence, className = "" } = props;
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold ring-1 ${STYLES[confidence]} ${className}`}
    >
      {LABELS[confidence]}
    </span>
  );
}
