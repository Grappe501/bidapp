import { Link } from "react-router-dom";
import { Button } from "@/components/ui/Button";
import { VendorComparisonTable } from "@/components/vendors/VendorComparisonTable";
import { useVendors } from "@/context/useVendors";
import { vendorsByIds } from "@/lib/vendor-utils";

export function VendorComparePage() {
  const { vendors, compareVendorIds, clearCompareSelection } = useVendors();
  const selected = vendorsByIds(vendors, compareVendorIds);

  return (
    <div className="p-8">
      <div className="mx-auto max-w-[1400px] space-y-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-ink">
              Vendor comparison
            </h1>
            <p className="mt-1 max-w-3xl text-sm text-ink-muted">
              Side-by-side view for strategic evaluation. Refine the set from
              the directory checkboxes.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link to="/vendors">
              <Button type="button" variant="secondary">
                Directory
              </Button>
            </Link>
            <Button type="button" variant="secondary" onClick={clearCompareSelection}>
              Clear selection
            </Button>
          </div>
        </div>

        {selected.length < 2 ? (
          <div className="rounded-lg border border-dashed border-border bg-zinc-50/50 px-6 py-10 text-center">
            <p className="text-sm font-medium text-ink">
              Select at least two vendors to compare
            </p>
            <p className="mt-1 text-sm text-ink-muted">
              Use checkboxes on the vendor directory, then return here.
            </p>
            <Link to="/vendors" className="mt-4 inline-block">
              <Button type="button">Go to directory</Button>
            </Link>
          </div>
        ) : (
          <VendorComparisonTable vendors={selected} />
        )}
      </div>
    </div>
  );
}
