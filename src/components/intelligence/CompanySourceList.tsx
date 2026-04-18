export function CompanySourceList({ sources }: { sources: string[] }) {
  if (sources.length === 0) {
    return (
      <p className="text-sm text-ink-muted">No sources recorded yet.</p>
    );
  }
  return (
    <ul className="list-inside list-disc space-y-1 text-sm text-ink-muted">
      {sources.map((s, i) => (
        <li key={`${s}-${i}`} className="break-all">
          {s}
        </li>
      ))}
    </ul>
  );
}
