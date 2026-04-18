import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { useNavigate } from "react-router-dom";

type RequirementSourceCardProps = {
  sourceFileId: string;
  sourceFileName: string;
  sourceSection: string;
  verbatimText: string;
};

export function RequirementSourceCard({
  sourceFileId,
  sourceFileName,
  sourceSection,
  verbatimText,
}: RequirementSourceCardProps) {
  const navigate = useNavigate();

  return (
    <Card className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold text-ink">Source</h2>
          <p className="mt-1 text-sm text-ink-muted">
            Traceability to the library file record. Parsing output will attach
            here in later phases.
          </p>
        </div>
        <Button
          type="button"
          variant="secondary"
          className="shrink-0"
          onClick={() => navigate(`/files/${sourceFileId}`)}
        >
          Open file record
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

      <div>
        <p className="text-xs font-medium uppercase tracking-wider text-ink-subtle">
          Verbatim language
        </p>
        <pre className="mt-2 max-h-64 overflow-auto rounded-md border border-border bg-zinc-50/80 p-3 text-sm leading-relaxed text-ink">
          {verbatimText}
        </pre>
      </div>
    </Card>
  );
}
