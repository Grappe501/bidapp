import { Link } from "react-router-dom";
import { Card } from "@/components/ui/Card";
import type { OutputAttentionItem } from "@/lib/output-utils";

type OutputAttentionPanelProps = {
  items: OutputAttentionItem[];
};

export function OutputAttentionPanel({ items }: OutputAttentionPanelProps) {
  if (items.length === 0) {
    return (
      <Card className="border-emerald-200/70 bg-emerald-50/30 p-4 text-sm">
        <p className="font-medium text-emerald-950/90">No output blockers on this snapshot</p>
        <p className="mt-1 text-xs leading-relaxed text-emerald-950/80">
          No required-artifact gaps, packaging blockers, or open redaction items surfaced
          here. Continue legal review and final packaging discipline as usual.
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-2">
      <h2 className="text-xs font-semibold uppercase tracking-wide text-ink-subtle">
        Attention queue
      </h2>
      <Card className="divide-y divide-border/70 p-0">
        <div className="px-4 py-3">
          <p className="text-[11px] leading-relaxed text-ink-muted">
            Calm queue — highest-impact packaging and readiness items first. Each line
            links to the workspace that can resolve it.
          </p>
        </div>
        <ul className="divide-y divide-border/60">
          {items.map((it) => (
            <li key={it.id} className="px-4 py-3 text-sm">
              <p className="font-medium text-ink">{it.title}</p>
              <p className="mt-1 text-xs leading-relaxed text-ink-muted">
                {it.detail}
              </p>
              {it.to ? (
                <Link
                  to={it.to}
                  className="mt-2 inline-block text-xs font-medium text-ink underline-offset-2 hover:underline"
                >
                  Open related workspace →
                </Link>
              ) : null}
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}
