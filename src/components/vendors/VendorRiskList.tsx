type VendorRiskListProps = {
  risks: string[];
};

export function VendorRiskList({ risks }: VendorRiskListProps) {
  if (risks.length === 0) {
    return (
      <p className="text-sm text-ink-muted">No major risks recorded.</p>
    );
  }

  return (
    <div className="space-y-2">
      <h3 className="text-sm font-semibold text-ink">Risks & sensitivities</h3>
      <ul className="space-y-2">
        {risks.map((r, i) => (
          <li
            key={i}
            className="border-l-2 border-amber-200/90 pl-3 text-sm leading-relaxed text-ink"
          >
            {r}
          </li>
        ))}
      </ul>
    </div>
  );
}
