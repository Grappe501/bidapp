import { Badge } from "@/components/ui/Badge";
import { FileStatusBadge } from "@/components/files/FileStatusBadge";
import { formatRecordDate } from "@/lib/display-format";
import type { FileRecord } from "@/types";

type FileLibraryTableProps = {
  files: FileRecord[];
  onOpen: (file: FileRecord) => void;
};

export function FileLibraryTable({ files, onOpen }: FileLibraryTableProps) {
  if (files.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-border bg-zinc-50/50 px-6 py-12 text-center">
        <p className="text-sm font-medium text-ink">No files match filters</p>
        <p className="mt-1 text-sm text-ink-muted">
          Adjust filters or upload new source materials.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-lg border border-border bg-surface-raised shadow-sm">
      <div className="overflow-x-auto">
        <table className="min-w-full border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-border bg-zinc-50/80">
              <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-ink-muted">
                Name
              </th>
              <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-ink-muted">
                Category
              </th>
              <th className="hidden px-4 py-3 text-xs font-semibold uppercase tracking-wider text-ink-muted md:table-cell">
                Source
              </th>
              <th className="hidden px-4 py-3 text-xs font-semibold uppercase tracking-wider text-ink-muted lg:table-cell">
                Uploaded
              </th>
              <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-ink-muted">
                Status
              </th>
            </tr>
          </thead>
          <tbody>
            {files.map((file) => (
              <tr
                key={file.id}
                className="cursor-pointer border-b border-border last:border-b-0 hover:bg-zinc-50/80"
                onClick={() => onOpen(file)}
              >
                <td className="max-w-[240px] px-4 py-3">
                  <div className="truncate font-medium text-ink">{file.name}</div>
                  <div className="mt-0.5 flex flex-wrap gap-1 md:hidden">
                    <span className="text-[11px] text-ink-subtle">
                      {file.sourceType}
                    </span>
                  </div>
                </td>
                <td className="whitespace-nowrap px-4 py-3">
                  <Badge variant="neutral" className="max-w-[160px] truncate">
                    {file.category}
                  </Badge>
                </td>
                <td className="hidden whitespace-nowrap px-4 py-3 text-ink-muted md:table-cell">
                  {file.sourceType}
                </td>
                <td className="hidden whitespace-nowrap px-4 py-3 text-ink-muted lg:table-cell">
                  {formatRecordDate(file.uploadedAt)}
                </td>
                <td className="whitespace-nowrap px-4 py-3">
                  <FileStatusBadge status={file.status} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
