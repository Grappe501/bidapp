import { Link, useParams } from "react-router-dom";
import { BidControlNav } from "@/components/control/BidControlNav";
import { ReviewIssueDetailCard } from "@/components/review/ReviewIssueDetailCard";
import { ReviewResolutionPanel } from "@/components/review/ReviewResolutionPanel";
import { useReview } from "@/context/useReview";

export function ReviewIssueDetailPage() {
  const { issueId: rawId } = useParams<{ issueId: string }>();
  const issueId = rawId ? decodeURIComponent(rawId) : "";
  const { getIssue, updateIssueStatus } = useReview();
  const issue = issueId ? getIssue(issueId) : undefined;

  if (!issueId || !issue) {
    return (
      <div className="p-8">
        <div className="mx-auto max-w-lg space-y-4">
          <h1 className="text-xl font-semibold text-ink">Issue not found</h1>
          <Link
            to="/review/issues"
            className="inline-flex rounded-md border border-border bg-surface-raised px-3 py-2 text-sm font-medium text-ink shadow-sm hover:bg-zinc-50"
          >
            Back to issues
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="mx-auto max-w-3xl space-y-6">
        <BidControlNav />
        <div className="flex flex-wrap gap-3">
          <Link
            to="/review/issues"
            className="text-sm text-ink-muted hover:text-ink"
          >
            ← Issues
          </Link>
          <Link
            to="/review"
            className="text-sm text-ink-muted hover:text-ink"
          >
            Dashboard
          </Link>
        </div>
        <ReviewIssueDetailCard issue={issue} />
        <ReviewResolutionPanel
          issueId={issue.id}
          currentStatus={issue.status}
          onUpdate={(status, notes) => updateIssueStatus(issue.id, status, notes)}
        />
      </div>
    </div>
  );
}
