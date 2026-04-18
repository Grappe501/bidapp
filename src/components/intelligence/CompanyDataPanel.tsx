import { Card } from "@/components/ui/Card";

type CompanyDataPanelProps = {
  title: string;
  items: string[];
  emptyMessage: string;
};

export function CompanyDataPanel({ title, items, emptyMessage }: CompanyDataPanelProps) {
  return (
    <Card className="space-y-2">
      <h4 className="text-xs font-semibold uppercase tracking-wider text-ink-subtle">
        {title}
      </h4>
      {items.length === 0 ? (
        <p className="text-sm text-ink-muted">{emptyMessage}</p>
      ) : (
        <ul className="list-inside list-disc space-y-1.5 text-sm text-ink-muted">
          {items.map((item, i) => (
            <li key={`${item}-${i}`}>{item}</li>
          ))}
        </ul>
      )}
    </Card>
  );
}
