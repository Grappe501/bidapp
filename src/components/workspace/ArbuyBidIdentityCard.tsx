import { Card } from "@/components/ui/Card";
import { getCanonicalArbuyModel } from "@/data/canonical-arbuy-s000000479";
import type { Project } from "@/types";

type ArbuyBidIdentityCardProps = {
  project: Project;
};

function formatPortalDate(iso: string): string {
  try {
    return new Date(iso).toLocaleString(undefined, {
      dateStyle: "medium",
      timeStyle: "short",
    });
  } catch {
    return iso;
  }
}

/**
 * Compact official solicitation identity from canonical ARBuy data (when registered for the bid).
 */
export function ArbuyBidIdentityCard({ project }: ArbuyBidIdentityCardProps) {
  const model = getCanonicalArbuyModel(project.bidNumber);
  if (!model) return null;

  const h = model.header;

  return (
    <Card className="border border-teal-200/70 bg-gradient-to-br from-teal-50/35 via-white to-white p-5 shadow-sm">
      <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-teal-800/80">
        Official solicitation (ARBuy)
      </p>
      <div className="mt-2 flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between">
        <h2 className="text-lg font-semibold tracking-tight text-ink">{h.solicitationNumber}</h2>
        <span className="text-xs font-medium text-ink-muted">{h.organization}</span>
      </div>
      <p className="mt-1 text-sm text-ink">{h.description}</p>
      <dl className="mt-4 grid gap-3 text-xs sm:grid-cols-2">
        <div>
          <dt className="text-[10px] font-semibold uppercase tracking-wide text-ink-subtle">
            Bid opening
          </dt>
          <dd className="mt-0.5 text-ink">{formatPortalDate(h.bidOpeningDate)}</dd>
        </div>
        <div>
          <dt className="text-[10px] font-semibold uppercase tracking-wide text-ink-subtle">
            Purchaser
          </dt>
          <dd className="mt-0.5 text-ink">{h.purchaser}</dd>
        </div>
        <div>
          <dt className="text-[10px] font-semibold uppercase tracking-wide text-ink-subtle">
            Electronic quote
          </dt>
          <dd className="mt-0.5 text-ink">
            {h.allowElectronicQuote ? "Allowed (ARBuy)" : "Not indicated"}
          </dd>
        </div>
        <div>
          <dt className="text-[10px] font-semibold uppercase tracking-wide text-ink-subtle">
            Department
          </dt>
          <dd className="mt-0.5 text-ink">{h.department}</dd>
        </div>
      </dl>
    </Card>
  );
}
