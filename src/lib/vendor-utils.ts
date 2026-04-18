import type { Vendor, VendorCategory, VendorFitScore, VendorStatus } from "@/types";

export type VendorDirectoryFilters = {
  category: VendorCategory | "all";
  status: VendorStatus | "all";
  minFitScore: VendorFitScore | "all";
  search: string;
};

export function filterVendors(
  vendors: Vendor[],
  filters: VendorDirectoryFilters,
): Vendor[] {
  const q = filters.search.trim().toLowerCase();
  return vendors.filter((v) => {
    if (filters.category !== "all" && v.category !== filters.category) {
      return false;
    }
    if (filters.status !== "all" && v.status !== filters.status) {
      return false;
    }
    if (filters.minFitScore !== "all" && v.fitScore < filters.minFitScore) {
      return false;
    }
    if (q) {
      const hay = `${v.name} ${v.summary} ${v.likelyStackRole} ${v.notes}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });
}

export function sourceFileCount(vendor: Vendor): number {
  return vendor.sourceFileIds.length;
}

export function vendorsByIds(
  vendors: Vendor[],
  ids: string[],
): Vendor[] {
  const map = new Map(vendors.map((v) => [v.id, v]));
  return ids.map((id) => map.get(id)).filter(Boolean) as Vendor[];
}

export function topStrings(items: string[], n: number): string[] {
  return items.slice(0, n);
}
