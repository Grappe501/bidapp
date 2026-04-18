import { BidControlNav } from "@/components/control/BidControlNav";
import { ReviewFilterBar } from "@/components/review/ReviewFilterBar";
import { ReviewIssueTable } from "@/components/review/ReviewIssueTable";
import { Button } from "@/components/ui/Button";
import { useReview } from "@/context/useReview";

export function ReviewIssuesPage() {
  const { issues, filters, setFilters, runReview } = useReview();

  return (
    <div className="p-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <BidControlNav />

        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-ink">Review issues</h1>
            <p className="mt-2 max-w-2xl text-sm text-ink-muted">
              Deterministic rule output with analyst workflow. Filters apply to
              the table below.
            </p>
          </div>
          <Button type="button" variant="secondary" onClick={runReview}>
            Refresh scan
          </Button>
        </div>

        <ReviewFilterBar filters={filters} onChange={setFilters} />
        <ReviewIssueTable issues={issues} />
      </div>
    </div>
  );
}
