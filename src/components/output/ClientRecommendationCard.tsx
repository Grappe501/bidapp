import { Link } from "react-router-dom";
import { Card } from "@/components/ui/Card";
import type { ArchitectureOption } from "@/types";

export function ClientRecommendationCard({
  option,
}: {
  option: ArchitectureOption | undefined;
}) {
  if (!option) {
    return (
      <Card className="border-dashed border-amber-200/80 bg-amber-50/20 p-5">
        <p className="text-sm font-medium text-ink">Strategic recommendation</p>
        <p className="mt-2 text-sm text-ink-muted">
          No recommended architecture is selected yet. Designate one in the architecture
          workspace so this client review packet carries a clear decision narrative.
        </p>
        <Link
          to="/architecture"
          className="mt-3 inline-block text-xs font-semibold text-ink underline-offset-2 hover:underline"
        >
          Architecture workspace →
        </Link>
      </Card>
    );
  }

  const supporting = option.components.filter((c) => !c.optional);
  const optional = option.components.filter((c) => c.optional);

  return (
    <Card className="overflow-hidden p-0">
      <div className="border-b border-border bg-zinc-50/80 px-5 py-4">
        <p className="text-[10px] font-semibold uppercase tracking-wide text-ink-subtle">
          Strategic recommendation
        </p>
        <h2 className="mt-1 text-base font-semibold leading-snug text-ink">
          {option.name}
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-ink-muted">{option.summary}</p>
      </div>
      <div className="space-y-5 px-5 py-4 text-sm">
        <section>
          <h3 className="text-[10px] font-semibold uppercase tracking-wide text-ink-subtle">
            Why this option
          </h3>
          <ul className="mt-2 space-y-1.5 text-ink">
            {option.narrativeStrengths.slice(0, 4).map((s, i) => (
              <li key={i} className="flex gap-2 leading-relaxed">
                <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-emerald-600/80" />
                <span>{s}</span>
              </li>
            ))}
          </ul>
        </section>
        <section>
          <h3 className="text-[10px] font-semibold uppercase tracking-wide text-ink-subtle">
            Malone&apos;s role
          </h3>
          <p className="mt-2 leading-relaxed text-ink-muted">
            {option.malonePositionSummary}
          </p>
        </section>
        <section>
          <h3 className="text-[10px] font-semibold uppercase tracking-wide text-ink-subtle">
            Supporting vendors in this stack
          </h3>
          <ul className="mt-2 space-y-2 text-ink">
            {supporting.map((c) => (
              <li key={c.id} className="leading-snug">
                <span className="font-medium">{c.vendorName}</span>
                <span className="text-ink-muted"> — {c.role}. </span>
                <span className="text-ink-muted">{c.responsibilitySummary}</span>
              </li>
            ))}
          </ul>
          {optional.length ? (
            <p className="mt-3 text-xs text-ink-subtle">
              Optional layers: {optional.map((c) => c.vendorName).join(", ")}.
            </p>
          ) : null}
        </section>
        <section>
          <h3 className="text-[10px] font-semibold uppercase tracking-wide text-ink-subtle">
            Bid strategy implication
          </h3>
          <p className="mt-2 leading-relaxed text-ink-muted">
            {option.notes ||
              "Positions the response around a defensible system-of-record story, clear workflow ownership, and Malone-led governance — aligned to scored Experience, Solution, and Risk volumes."}
          </p>
        </section>
        <Link
          to="/architecture"
          className="inline-block text-xs font-semibold text-ink underline-offset-2 hover:underline"
        >
          Refine or compare options →
        </Link>
      </div>
    </Card>
  );
}
