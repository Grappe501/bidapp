import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Textarea } from "@/components/ui/Textarea";
import type { ReviewIssueStatus } from "@/types";

type ReviewResolutionPanelProps = {
  issueId: string;
  currentStatus: ReviewIssueStatus;
  onUpdate: (status: ReviewIssueStatus, notes?: string) => void;
};

export function ReviewResolutionPanel({
  issueId,
  currentStatus,
  onUpdate,
}: ReviewResolutionPanelProps) {
  const [notes, setNotes] = useState("");

  return (
    <div className="space-y-3 rounded-lg border border-border bg-surface-raised p-4">
      <h2 className="text-sm font-semibold text-ink">Resolution</h2>
      <p className="text-xs text-ink-muted">
        Move findings through a calm workflow. Status is stored locally for this
        browser until the next persistence packet.
      </p>
      <Textarea
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        placeholder="Analyst notes (optional)…"
        rows={3}
        aria-label="Resolution notes"
      />
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          variant="secondary"
          disabled={currentStatus === "In Review"}
          onClick={() => onUpdate("In Review", notes)}
        >
          Mark in review
        </Button>
        <Button
          type="button"
          disabled={currentStatus === "Resolved"}
          onClick={() => onUpdate("Resolved", notes)}
        >
          Resolve
        </Button>
        <Button
          type="button"
          variant="secondary"
          disabled={currentStatus === "Dismissed"}
          onClick={() => onUpdate("Dismissed", notes)}
        >
          Dismiss
        </Button>
      </div>
      <p className="text-xs text-ink-subtle">Issue id: {issueId}</p>
    </div>
  );
}
