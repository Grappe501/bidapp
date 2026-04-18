import { Card } from "@/components/ui/Card";

export function ContractClauseCard({
  reference,
  title,
  obligationSummary,
  proposalExposure,
}: {
  reference: string;
  title: string;
  obligationSummary: string;
  proposalExposure: string;
}) {
  return (
    <Card className="space-y-3">
      <div>
        <p className="text-[11px] font-medium uppercase tracking-wider text-ink-subtle">
          {reference}
        </p>
        <h3 className="mt-1 font-semibold text-ink">{title}</h3>
      </div>
      <div className="space-y-2 text-sm">
        <div>
          <p className="text-xs font-medium text-ink-subtle">Binding obligation</p>
          <p className="mt-1 text-ink-muted">{obligationSummary}</p>
        </div>
        <div className="rounded-md border border-amber-200/80 bg-amber-50/50 px-3 py-2">
          <p className="text-xs font-medium text-amber-950">Proposal exposure</p>
          <p className="mt-1 text-sm text-amber-950/90">{proposalExposure}</p>
        </div>
      </div>
    </Card>
  );
}
