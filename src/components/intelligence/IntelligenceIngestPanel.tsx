import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import { formatRecordDate } from "@/lib/display-format";
import type { CompanyProfile, IntelligenceClassification } from "@/types";
import { INTELLIGENCE_CLASSIFICATIONS } from "@/types";

type IntelligenceIngestPanelProps = {
  profiles: CompanyProfile[];
  onIngest: (input: {
    companyProfileId: string;
    classification: IntelligenceClassification;
    body: string;
    sourceUrl: string;
  }) => void;
};

export function IntelligenceIngestPanel({
  profiles,
  onIngest,
}: IntelligenceIngestPanelProps) {
  return (
    <Card className="space-y-4">
      <div>
        <h3 className="text-sm font-semibold text-ink">Intelligence ingest</h3>
        <p className="mt-1 text-xs text-ink-muted">
          Paste notes or URLs and route them into structured fields. Automation
          and scraping come later—this is the capture shape.
        </p>
      </div>
      <form
        className="grid gap-3 sm:grid-cols-2"
        onSubmit={(e) => {
          e.preventDefault();
          const fd = new FormData(e.currentTarget);
          onIngest({
            companyProfileId: String(fd.get("companyProfileId")),
            classification: String(
              fd.get("classification"),
            ) as IntelligenceClassification,
            body: String(fd.get("body") ?? ""),
            sourceUrl: String(fd.get("sourceUrl") ?? ""),
          });
          e.currentTarget.reset();
        }}
      >
        <label className="block space-y-1.5">
          <span className="text-xs font-medium text-ink-muted">Company</span>
          <Select name="companyProfileId" required defaultValue={profiles[0]?.id}>
            {profiles.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} ({p.type})
              </option>
            ))}
          </Select>
        </label>
        <label className="block space-y-1.5">
          <span className="text-xs font-medium text-ink-muted">Classification</span>
          <Select name="classification" required defaultValue="capability">
            {INTELLIGENCE_CLASSIFICATIONS.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </Select>
        </label>
        <label className="block space-y-1.5 sm:col-span-2">
          <span className="text-xs font-medium text-ink-muted">Notes / excerpt</span>
          <Textarea name="body" rows={4} required placeholder="Paste intelligence text…" />
        </label>
        <label className="block space-y-1.5 sm:col-span-2">
          <span className="text-xs font-medium text-ink-muted">Source URL (optional)</span>
          <Input name="sourceUrl" type="url" placeholder="https://…" />
        </label>
        <div className="sm:col-span-2 flex justify-end">
          <Button type="submit">Attach to profile</Button>
        </div>
      </form>
    </Card>
  );
}

/** Read-only list of recent ingest events */
export function IntelligenceIngestHistory({
  entries,
}: {
  entries: { id: string; body: string; classification: string; createdAt: string }[];
}) {
  if (entries.length === 0) return null;
  return (
    <Card className="space-y-2">
      <h4 className="text-xs font-semibold uppercase tracking-wider text-ink-subtle">
        Recent ingest
      </h4>
      <ul className="max-h-48 space-y-2 overflow-y-auto text-xs text-ink-muted">
        {entries.slice(0, 12).map((e) => (
          <li key={e.id} className="border-b border-border pb-2 last:border-0">
            <span className="font-medium text-ink">{e.classification}</span>
            <span className="text-ink-subtle"> · {formatRecordDate(e.createdAt)}</span>
            <p className="mt-0.5 line-clamp-2">{e.body}</p>
          </li>
        ))}
      </ul>
    </Card>
  );
}
