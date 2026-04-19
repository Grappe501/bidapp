import { useDemoMode } from "@/context/demo-mode-context";

/**
 * Subtle indicator that stakeholder-safe presentation mode is active.
 */
export function DemoModeBanner() {
  const { isDemoMode, demoClientDisplayName } = useDemoMode();
  if (!isDemoMode) return null;

  return (
    <div className="border-b border-slate-200/90 bg-slate-50/95 px-4 py-1.5 text-center text-[11px] tracking-wide text-slate-700">
      <span className="font-medium text-slate-800">Client demo</span>
      <span className="text-slate-500"> · </span>
      <span className="text-slate-600">{demoClientDisplayName} workspace</span>
    </div>
  );
}
