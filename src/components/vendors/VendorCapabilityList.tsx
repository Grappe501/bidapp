import type { VendorCapability } from "@/types";

type VendorCapabilityListProps = {
  title?: string;
  capabilities: VendorCapability[];
};

export function VendorCapabilityList({
  title = "Capability statements",
  capabilities,
}: VendorCapabilityListProps) {
  if (capabilities.length === 0) {
    return (
      <p className="text-sm text-ink-muted">No structured capability bullets yet.</p>
    );
  }

  return (
    <div className="space-y-2">
      <h3 className="text-sm font-semibold text-ink">{title}</h3>
      <ul className="list-inside list-disc space-y-1.5 text-sm text-ink-muted marker:text-zinc-400">
        {capabilities.map((c) => (
          <li key={c.id} className="leading-relaxed">
            <span className="text-ink">{c.statement}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
