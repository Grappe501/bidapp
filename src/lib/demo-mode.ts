/**
 * Client demo / stakeholder walkthrough mode — presentation only (env flag).
 * Does not change business logic; use to hide operator surfaces and soften copy.
 */

export function isDemoModeClient(): boolean {
  return import.meta.env.VITE_DEMO_MODE === "true";
}

/** Display name for shell hero copy; defaults to AllCare Pharmacy. */
export function getDemoClientDisplayName(): string {
  const raw = (import.meta.env.VITE_DEMO_CLIENT_NAME ?? "").trim();
  return raw || "AllCare Pharmacy";
}
