import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Textarea } from "@/components/ui/Textarea";

type MalonePositionCardProps = {
  summary: string;
  editable?: boolean;
  onSave?: (next: string) => void;
};

export function MalonePositionCard({
  summary,
  editable,
  onSave,
}: MalonePositionCardProps) {
  if (editable && onSave) {
    return (
      <Card className="space-y-3 border-zinc-200 bg-zinc-50/40">
        <h3 className="text-sm font-semibold text-ink">Malone position</h3>
        <p className="text-xs text-ink-muted">
          How Malone sits relative to vendor components — orchestration,
          governance, and narrative ownership.
        </p>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const fd = new FormData(e.currentTarget);
            onSave(String(fd.get("malone") ?? ""));
          }}
        >
          <Textarea name="malone" rows={5} defaultValue={summary} />
          <div className="mt-2 flex justify-end">
            <Button type="submit">Save</Button>
          </div>
        </form>
      </Card>
    );
  }

  return (
    <Card className="space-y-3 border-zinc-200 bg-zinc-50/40">
      <h3 className="text-sm font-semibold text-ink">Malone position</h3>
      <p className="text-sm leading-relaxed text-ink">{summary}</p>
    </Card>
  );
}
