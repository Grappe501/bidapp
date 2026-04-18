import { Button } from "@/components/ui/Button";

type RequirementApprovalPanelProps = {
  selectedCount: number;
  onApproveSelected: () => void;
  onClearSelection: () => void;
};

export function RequirementApprovalPanel({
  selectedCount,
  onApproveSelected,
  onClearSelection,
}: RequirementApprovalPanelProps) {
  if (selectedCount === 0) return null;

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-zinc-50/80 px-4 py-3">
      <p className="text-sm text-ink">
        <span className="font-semibold">{selectedCount}</span> selected
      </p>
      <div className="flex flex-wrap gap-2">
        <Button type="button" variant="secondary" onClick={onClearSelection}>
          Clear selection
        </Button>
        <Button type="button" onClick={onApproveSelected}>
          Approve selected
        </Button>
      </div>
    </div>
  );
}
