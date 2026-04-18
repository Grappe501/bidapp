import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useProjectWorkspace } from "@/context/project-workspace-context";
import type { Vendor } from "@/types";
import { MAX_COMPARE_VENDORS, VendorContext } from "./vendor-context";

export function VendorProvider({ children }: { children: ReactNode }) {
  const { workspace } = useProjectWorkspace();
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [compareVendorIds, setCompareVendorIds] = useState<string[]>([]);

  useEffect(() => {
    if (!workspace) return;
    setVendors(workspace.vendors);
    setCompareVendorIds(workspace.vendors.slice(0, MAX_COMPARE_VENDORS).map((v) => v.id));
  }, [workspace]);

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
