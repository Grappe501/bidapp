import { Card } from "@/components/ui/Card";
import { cn } from "@/lib/utils";
import type { ArbuySolicitationCompliance } from "@/types";

type ArbuySolicitationStatusProps = {
  compliance: ArbuySolicitationCompliance | null;
};

export function ArbuySolicitationStatus({ compliance }: ArbuySolicitationStatusProps) {
  if (!compliance?.applicable) {
    return null;
  }

  const c = compliance;
  const tone = c.ready ? "ok" : "warn";

  return (
    <Card
      className={cn(
        "space-y-4 border p-5 shadow-sm",
        tone === "ok" && "border-teal-200/90 bg-gradient-to-br from-teal-50/50 to-white",
        tone === "warn" && "border-amber-200/90 bg-gradient-to-br from-amber-50/40 to-white",
      )}
    >
      <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-sm font-semibold text-ink">ARBuy solicitation</h2>
          <p className="mt-1 max-w-2xl text-xs leading-relaxed text-ink-muted">
            Official procurement record: portal metadata, required attachment coverage against uploads,
            and quote line count vs structured workbook (unit costs are not read from ARBuy).
          </p>
        </div>
        <div
          className={cn(
            "shrink-0 rounded border px-2.5 py-1 text-[10px] font-medium uppercase tracking-wide",
            c.ready
              ? "border-emerald-200 bg-emerald-50/90 text-emerald-950"
              : "border-amber-200 bg-amber-50/90 text-amber-950",
          )}
        >
          {c.ready ? "Structure ready" : "Incomplete"}
        </div>
      </div>

      <dl className="grid gap-2 text-xs sm:grid-cols-2">
        <div className="rounded-lg border border-zinc-200/80 bg-white/90 px-3 py-2">
          <dt className="text-[10px] font-semibold uppercase tracking-wide text-ink-subtle">
            Quote lines (ARBuy)
          </dt>
          <dd className="mt-1 font-medium tabular-nums text-ink">{c.quoteLineCount}</dd>
        </div>
        <div className="rounded-lg border border-zinc-200/80 bg-white/90 px-3 py-2">
          <dt className="text-[10px] font-semibold uppercase tracking-wide text-ink-subtle">
            Workbook lines
          </dt>
          <dd className="mt-1 font-medium tabular-nums text-ink">{c.pricingLineCount}</dd>
        </div>
        <div className="rounded-lg border border-zinc-200/80 bg-white/90 px-3 py-2">
          <dt className="text-[10px] font-semibold uppercase tracking-wide text-ink-subtle">
            Attachments
          </dt>
          <dd className="mt-1 text-ink">
            {c.attachmentsComplete ? "All required files matched" : `${c.missingAttachments.length} missing`}
          </dd>
        </div>
        <div className="rounded-lg border border-zinc-200/80 bg-white/90 px-3 py-2">
          <dt className="text-[10px] font-semibold uppercase tracking-wide text-ink-subtle">
            Price sheet file
          </dt>
          <dd className="mt-1 text-ink">{c.priceSheetDocumentPresent ? "Detected" : "Not detected"}</dd>
        </div>
      </dl>

      {!c.quoteStructureCountAligned && c.pricingSupportPresent ? (
        <p className="text-xs text-amber-950/90">
          Quote grid line count ({c.quoteLineCount}) differs from workbook line count ({c.pricingLineCount})
          — confirm mapping on the official price sheet.
        </p>
      ) : null}

      {c.issues.length > 0 ? (
        <ul className="list-inside list-disc space-y-1 text-xs text-ink-muted">
          {c.issues.map((line) => (
            <li key={line.slice(0, 80)}>{line}</li>
          ))}
        </ul>
      ) : null}
    </Card>
  );
}
