import { Card } from "@/components/ui/Card";
import {
  S000000479_BID_NUMBER,
  WHY_ALLCARE_WINS_POINTS,
  WHY_ALLCARE_WINS_TITLE,
  WHY_ALLCARE_WINS_TOP_HIGHLIGHTS,
} from "@/data/why-allcare-wins-s000000479";

type WhyWinsCardProps = {
  bidNumber: string;
};

export function WhyWinsCard({ bidNumber }: WhyWinsCardProps) {
  if (bidNumber !== S000000479_BID_NUMBER) {
    return null;
  }

  return (
    <Card className="border border-zinc-200/90 bg-white p-6 shadow-sm">
      <h2 className="text-lg font-semibold tracking-tight text-ink">
        {WHY_ALLCARE_WINS_TITLE}
      </h2>
      <p className="mt-1 text-sm text-ink-muted">
        How AllCare stands apart for this solicitation — at a glance.
      </p>

      <ul className="mt-5 space-y-2.5 text-sm leading-snug text-ink">
        {WHY_ALLCARE_WINS_TOP_HIGHLIGHTS.map((line) => (
          <li key={line} className="flex gap-2.5">
            <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-700/80" aria-hidden />
            <span>{line}</span>
          </li>
        ))}
      </ul>

      <details className="mt-5 rounded-lg border border-zinc-200/80 bg-zinc-50/60 px-4 py-3">
        <summary className="cursor-pointer list-none text-sm font-medium text-ink underline-offset-2 [&::-webkit-details-marker]:hidden">
          <span className="underline decoration-zinc-300 underline-offset-2 hover:decoration-ink/40">
            View full differentiators
          </span>
        </summary>
        <ul className="mt-4 space-y-3 border-t border-zinc-200/70 pt-4 text-sm leading-relaxed text-ink">
          {WHY_ALLCARE_WINS_POINTS.map((line, i) => (
            <li key={`why-wins-${i}`} className="flex gap-2.5">
              <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-zinc-400" aria-hidden />
              <span>{line}</span>
            </li>
          ))}
        </ul>
      </details>
    </Card>
  );
}
