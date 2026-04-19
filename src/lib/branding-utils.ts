import type { BrandingProfileApi } from "@/lib/functions-api";

/** Primary label for shell when API branding is loaded. */
export function liveClientDisplayName(
  branding: BrandingProfileApi | null | undefined,
): string {
  const fromApi =
    branding?.displayName?.trim() ||
    branding?.appDisplayName?.trim() ||
    "";
  return fromApi || "AllCare Pharmacy";
}

/** Short product name for sidebar / header lockup. */
export const LIVE_PRODUCT_NAME = "AllCare Bid OS";

export const LIVE_BID_SUBTITLE = "S000000479 · Pharmacy Services for DHS HDCs";
