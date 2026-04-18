import { sortTagsForDisplay } from "@/lib/display-format";

type FileTagsProps = {
  tags: string[];
  onRemove?: (tag: string) => void;
};

export function FileTags({ tags, onRemove }: FileTagsProps) {
  if (tags.length === 0) {
    return (
      <p className="text-sm text-ink-muted">No tags yet.</p>
    );
  }

  const ordered = sortTagsForDisplay(tags);

  return (
    <ul className="flex flex-wrap gap-2">
      {ordered.map((tag) => (
        <li
          key={tag}
          className="inline-flex items-center gap-1 rounded-md border border-border bg-zinc-50 px-2 py-1 text-xs font-medium text-ink"
        >
          <span>{tag}</span>
          {onRemove ? (
            <button
              type="button"
              className="ml-0.5 rounded px-1 text-ink-subtle hover:bg-zinc-200 hover:text-ink"
              onClick={() => onRemove(tag)}
              aria-label={`Remove tag ${tag}`}
            >
              ×
            </button>
          ) : null}
        </li>
      ))}
    </ul>
  );
}
