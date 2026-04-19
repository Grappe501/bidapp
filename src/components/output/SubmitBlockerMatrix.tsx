import { Card } from "@/components/ui/Card";

type MatrixRow = {
  category: string;
  items: string[];
};

function categorizeBlockers(blockers: string[]): MatrixRow[] {
  const buckets: Record<string, string[]> = {
    "Submission / package": [],
    "Pricing / contract": [],
    "Proof / grounded review": [],
    "Scoring competitiveness": [],
    "Compliance / redaction": [],
  };

  const put = (cat: keyof typeof buckets, line: string) => {
    buckets[cat].push(line);
  };

  for (const b of blockers) {
    const lower = b.toLowerCase();
    if (
      /pricing|price sheet|workbook|contract-compliant|totals/.test(lower)
    ) {
      put("Pricing / contract", b);
    } else if (
      /solicitation|required item|artifact|validated|linked|packaging/.test(lower)
    ) {
      put("Submission / package", b);
    } else if (
      /ground|unsupported|proof|mitigation|evidence|grounding/.test(lower)
    ) {
      put("Proof / grounded review", b);
    } else if (/evaluator|score|technical|posture|defensible/.test(lower)) {
      put("Scoring competitiveness", b);
    } else if (/redact|disclosure|compliance/.test(lower)) {
      put("Compliance / redaction", b);
    } else {
      put("Proof / grounded review", b);
    }
  }

  return (Object.keys(buckets) as (keyof typeof buckets)[])
    .map((category) => ({
      category,
      items: buckets[category],
    }))
    .filter((r) => r.items.length > 0);
}

export function SubmitBlockerMatrix({ blockers }: { blockers: string[] }) {
  const rows = categorizeBlockers(blockers);
  if (rows.length === 0) {
    return null;
  }

  return (
    <Card className="border-zinc-200/90 bg-white p-5 shadow-sm">
      <h2 className="text-sm font-semibold text-ink">Submit blocker matrix</h2>
      <p className="mt-1 text-xs text-ink-muted">
        Grouped by theme — fix the densest column first.
      </p>
      <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {rows.map((row) => (
          <div key={row.category} className="rounded-lg border border-border bg-zinc-50/40 p-3">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-ink-subtle">
              {row.category}
            </p>
            <ul className="mt-2 list-inside list-disc space-y-1 text-xs leading-relaxed text-ink">
              {row.items.map((x) => (
                <li key={x.slice(0, 48)}>{x}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </Card>
  );
}
