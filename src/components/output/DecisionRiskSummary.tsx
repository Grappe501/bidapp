import { Card } from "@/components/ui/Card";
import type { VendorDecisionSynthesis } from "@/types";

export function DecisionRiskSummary(props: {
  synthesis: VendorDecisionSynthesis;
}) {
  const { synthesis } = props;
  return (
    <Card className="space-y-2 border-amber-200/80 bg-amber-50/30 p-4">
      <h3 className="text-sm font-semibold text-ink">Critical risks & mitigation</h3>
      <p className="text-xs text-ink-muted">
        Mitigation posture:{" "}
        <span className="font-medium capitalize text-ink">{synthesis.mitigationPosture}</span>
      </p>
      {synthesis.criticalRisks.length > 0 ? (
        <ul className="list-inside list-disc space-y-1 text-[11px] text-ink">
          {synthesis.criticalRisks.slice(0, 8).map((r, i) => (
            <li key={i}>{r}</li>
          ))}
        </ul>
      ) : (
        <p className="text-[11px] text-emerald-900/80">No major synthesized risk lines.</p>
      )}
    </Card>
  );
}
