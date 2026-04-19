import { Card } from "@/components/ui/Card";

type VendorPointLossCardProps = {
  pointLossComparisons: string[];
  honestyNote: string;
};

export function VendorPointLossCard({
  pointLossComparisons,
  honestyNote,
}: VendorPointLossCardProps) {
  return (
    <Card className="space-y-3 p-4">
      <div>
        <h2 className="text-sm font-semibold text-ink">Point gain / loss vs alternatives</h2>
        <p className="mt-1 text-xs text-ink-muted">
          Directional narrative for Experience, Solution, Risk, and Interview — not a
          precise point prediction.
        </p>
      </div>
      {pointLossComparisons.length === 0 ? (
        <p className="text-sm text-ink-muted">Compare at least two vendors to see deltas.</p>
      ) : (
        <ul className="list-inside list-disc space-y-1.5 text-sm text-ink-muted">
          {pointLossComparisons.map((line, i) => (
            <li key={i}>{line}</li>
          ))}
        </ul>
      )}
      <p className="rounded-md border border-amber-200/80 bg-amber-50/60 p-2 text-xs text-amber-950/90">
        {honestyNote}
      </p>
    </Card>
  );
}
