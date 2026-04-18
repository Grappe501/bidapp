import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Textarea } from "@/components/ui/Textarea";
import { Button } from "@/components/ui/Button";
import { CompanyDataPanel } from "@/components/intelligence/CompanyDataPanel";
import { CompanySourceList } from "@/components/intelligence/CompanySourceList";
import type { CompanyProfile } from "@/types";

type CompanyProfileCardProps = {
  profile: CompanyProfile;
  onSaveSummary: (summary: string) => void;
};

export function CompanyProfileCard({ profile, onSaveSummary }: CompanyProfileCardProps) {
  return (
    <Card className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold text-ink">{profile.name}</h3>
          <Badge variant={profile.type === "Client" ? "emphasis" : "neutral"}>
            {profile.type}
          </Badge>
        </div>
      </div>
      <form
        className="space-y-2"
        onSubmit={(e) => {
          e.preventDefault();
          const fd = new FormData(e.currentTarget);
          onSaveSummary(String(fd.get("summary") ?? ""));
        }}
      >
        <label className="block space-y-1.5">
          <span className="text-xs font-medium text-ink-muted">Summary</span>
          <Textarea
            name="summary"
            rows={4}
            defaultValue={profile.summary}
          />
        </label>
        <div className="flex justify-end">
          <Button type="submit" variant="secondary">
            Save summary
          </Button>
        </div>
      </form>
      <div className="grid gap-4 md:grid-cols-2">
        <CompanyDataPanel
          title="Capabilities"
          items={profile.capabilities}
          emptyMessage="No capabilities yet — use ingest panel."
        />
        <CompanyDataPanel
          title="Risks"
          items={profile.risks}
          emptyMessage="No risks logged."
        />
        <CompanyDataPanel
          title="Claims (ingest)"
          items={profile.claims}
          emptyMessage="No ingested claims."
        />
        <CompanyDataPanel
          title="Integration detail"
          items={profile.integrationDetails}
          emptyMessage="No integration notes."
        />
      </div>
      <div>
        <h4 className="text-xs font-semibold uppercase tracking-wider text-ink-subtle">
          Sources
        </h4>
        <div className="mt-2">
          <CompanySourceList sources={profile.sources} />
        </div>
      </div>
    </Card>
  );
}
