import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/Button";
import { VendorDirectoryTable } from "@/components/vendors/VendorDirectoryTable";
import { VendorFilterBar } from "@/components/vendors/VendorFilterBar";
import { useVendors } from "@/context/useVendors";
import {
  filterVendors,
  type VendorDirectoryFilters,
} from "@/lib/vendor-utils";

const defaultFilters: VendorDirectoryFilters = {
  category: "all",
  status: "all",
  minFitScore: "all",
  search: "",
};

export function VendorsPage() {
  const navigate = useNavigate();
  const { vendors, compareVendorIds, toggleCompareVendor } = useVendors();
  const [filters, setFilters] = useState<VendorDirectoryFilters>(defaultFilters);

  const filtered = useMemo(
    () => filterVendors(vendors, filters),
    [vendors, filters],
  );

  return (
    <div className="p-8">
      <div className="mx-auto max-w-7xl space-y-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-ink">
              Vendor intelligence
            </h1>
            <p className="mt-1 max-w-3xl text-sm text-ink-muted">
              Decision workspace for partner fit—not a CRM. Compare candidates,
              record defensible judgments, and align stack roles before drafting.
            </p>
          </div>
          <Link to="/vendors/compare" className="shrink-0">
            <Button type="button">Compare vendors</Button>
          </Link>
        </div>

        <p className="text-xs text-ink-muted">
          Use row checkboxes to build a comparison set (up to four). Selection
          persists for this session.
        </p>

        <VendorFilterBar value={filters} onChange={setFilters} />

        <VendorDirectoryTable
          vendors={filtered}
          compareVendorIds={compareVendorIds}
          onToggleCompare={toggleCompareVendor}
          onOpen={(v) => navigate(`/vendors/${v.id}`)}
        />
      </div>
    </div>
  );
}
