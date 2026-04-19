import { Card } from "@/components/ui/Card";
import {
  CANONICAL_WHY_ALLCARE_WINS_BODY,
  CANONICAL_WHY_ALLCARE_WINS_SUBTITLE,
  CANONICAL_WHY_ALLCARE_WINS_TITLE,
  CANONICAL_WHY_ALLCARE_WINS_WHY_WORKS,
  S000000479_BID_NUMBER,
} from "@/data/canonical-why-allcare-wins-s000000479";
import { copyTextToClipboard } from "@/lib/output-utils";

type WhyAllCareWinsCardProps = {
  bidNumber: string;
};

export function WhyAllCareWinsCard({ bidNumber }: WhyAllCareWinsCardProps) {
  if (bidNumber !== S000000479_BID_NUMBER) return null;

  const fullText = [
    CANONICAL_WHY_ALLCARE_WINS_TITLE,
    "",
    CANONICAL_WHY_ALLCARE_WINS_SUBTITLE,
    "",
    CANONICAL_WHY_ALLCARE_WINS_BODY,
  ].join("\n");

  return (
    <Card className="border border-violet-200/90 bg-gradient-to-br from-violet-50/50 to-white p-5 shadow-sm">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-sm font-semibold text-ink">{CANONICAL_WHY_ALLCARE_WINS_TITLE}</h2>
          <p className="mt-1 text-xs text-ink-muted">{CANONICAL_WHY_ALLCARE_WINS_SUBTITLE}</p>
          <p className="mt-2 max-w-3xl text-xs leading-relaxed text-ink-subtle">
            Scoring-aligned differentiation: clear, defensible, no repetition of full volumes — the
            page evaluators remember when deciding whether the State is comfortable awarding this
            contract.
          </p>
        </div>
        <button
          type="button"
          className="shrink-0 rounded-md border border-border bg-white px-3 py-1.5 text-xs font-medium text-ink hover:bg-zinc-50"
          onClick={() => void copyTextToClipboard(fullText)}
        >
          Copy full text
        </button>
      </div>
      <ul className="mt-4 list-inside list-disc space-y-1 text-xs text-ink-muted">
        {CANONICAL_WHY_ALLCARE_WINS_WHY_WORKS.map((w) => (
          <li key={w.slice(0, 48)}>{w}</li>
        ))}
      </ul>
      <details className="mt-4 rounded-md border border-zinc-200/80 bg-zinc-50/50 p-3 text-xs">
        <summary className="cursor-pointer font-medium text-ink">Preview narrative</summary>
        <pre className="mt-3 max-h-64 overflow-y-auto whitespace-pre-wrap font-sans text-[11px] leading-relaxed text-ink-muted">
          {CANONICAL_WHY_ALLCARE_WINS_BODY}
        </pre>
      </details>
    </Card>
  );
}
