import { useContext } from "react";
import { VendorContext, type VendorContextValue } from "./vendor-context";

export function useVendors(): VendorContextValue {
  const ctx = useContext(VendorContext);
  if (!ctx) {
    throw new Error("useVendors must be used within VendorProvider");
  }
  return ctx;
}
