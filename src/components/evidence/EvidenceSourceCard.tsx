import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { useNavigate } from "react-router-dom";

type EvidenceSourceCardProps = {
  sourceFileId: string;
  sourceFileName: string;
  sourceSection: string;
};

export function EvidenceSourceCard({
  sourceFileId,
  sourceFileName,
  sourceSection,
}: EvidenceSourceCardProps) {
  const navigate = useNavigate();

  return (
    <Card className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold text-ink">Source context</h2>
          <p className="mt-1 text-sm text-ink-muted">
            File record and section reference for traceability.
          </p>
        </div>
        <Button
          type="button"
          variant="secondary"
          className="shrink-0"
          onClick={() => navigate(`/files/${sourceFileId}`)}
        >
          Open file
        </Button>
      </div>
      <div>
        <p className="text-xs font-medium uppercase tracking-wider text-ink-subtle">
          File
        </p>
        <p className="mt-1 text-sm font-medium text-ink">{sourceFileName}</p>
      </div>
      <div>
        <p className="text-xs font-medium uppercase tracking-wider text-ink-subtle">
          Section / reference
        </p>
        <p className="mt-1 text-sm text-ink">{sourceSection}</p>
      </div>
    </Card>
  );
}
