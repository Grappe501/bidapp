import { createContext } from "react";
import type { Vendor } from "@/types";

export type VendorContextValue = {
  vendors: Vendor[];
  updateVendor: (id: string, patch: Partial<Vendor>) => void;
  compareVendorIds: string[];
  toggleCompareVendor: (vendorId: string) => void;
  setCompareVendorIds: (ids: string[]) => void;
  clearCompareSelection: () => void;
};

export const VendorContext = createContext<VendorContextValue | null>(null);

export const MAX_COMPARE_VENDORS = 4;
