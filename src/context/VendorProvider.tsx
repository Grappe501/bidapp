import {
  useCallback,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { MOCK_VENDORS } from "@/data/mockVendors";
import type { Vendor } from "@/types";
import { MAX_COMPARE_VENDORS, VendorContext } from "./vendor-context";

const DEFAULT_COMPARE_IDS = [
  "vendor-suite-rx",
  "vendor-evolved-rx",
  "vendor-personal-med",
];

export function VendorProvider({ children }: { children: ReactNode }) {
  const [vendors, setVendors] = useState<Vendor[]>(() => [...MOCK_VENDORS]);
  const [compareVendorIds, setCompareVendorIds] = useState<string[]>(() => [
    ...DEFAULT_COMPARE_IDS,
  ]);

  const updateVendor = useCallback((id: string, patch: Partial<Vendor>) => {
    const touched = new Date().toISOString();
    setVendors((prev) =>
      prev.map((v) => (v.id === id ? { ...v, ...patch, updatedAt: touched } : v)),
    );
  }, []);

  const toggleCompareVendor = useCallback((vendorId: string) => {
    setCompareVendorIds((prev) => {
      if (prev.includes(vendorId)) {
        return prev.filter((id) => id !== vendorId);
      }
      if (prev.length >= MAX_COMPARE_VENDORS) {
        return [...prev.slice(1), vendorId];
      }
      return [...prev, vendorId];
    });
  }, []);

  const clearCompareSelection = useCallback(() => {
    setCompareVendorIds([]);
  }, []);

  const value = useMemo(
    () => ({
      vendors,
      updateVendor,
      compareVendorIds,
      toggleCompareVendor,
      setCompareVendorIds,
      clearCompareSelection,
    }),
    [
      vendors,
      updateVendor,
      compareVendorIds,
      toggleCompareVendor,
      clearCompareSelection,
    ],
  );

  return (
    <VendorContext.Provider value={value}>{children}</VendorContext.Provider>
  );
}
