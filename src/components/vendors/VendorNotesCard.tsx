import { Card } from "@/components/ui/Card";

type VendorNotesCardProps = {
  summary: string;
  pricingNotes: string;
  generalNotes: string;
};

export function VendorNotesCard({
  summary,
  pricingNotes,
  generalNotes,
}: VendorNotesCardProps) {
  return (
    <Card className="space-y-5">
      <div>
        <h3 className="text-sm font-semibold text-ink">Strategic summary</h3>
        <p className="mt-2 text-sm leading-relaxed text-ink-muted">{summary}</p>
      </div>
      <div>
        <h3 className="text-sm font-semibold text-ink">Pricing notes</h3>
        <p className="mt-2 text-sm leading-relaxed text-ink-muted">
          {pricingNotes || "—"}
        </p>
      </div>
      <div>
        <h3 className="text-sm font-semibold text-ink">Working notes</h3>
        <p className="mt-2 text-sm leading-relaxed text-ink-muted">
          {generalNotes || "—"}
        </p>
      </div>
    </Card>
  );
}
