import { Card } from "@/components/ui/Card";
import { FileStatusBadge } from "@/components/files/FileStatusBadge";
import { FileTags } from "@/components/files/FileTags";
import { formatRecordDate } from "@/lib/display-format";
import type { FileRecord } from "@/types";
import { Badge } from "@/components/ui/Badge";

type FileMetadataCardProps = {
  file: FileRecord;
  onRemoveTag?: (tag: string) => void;
};

export function FileMetadataCard({
  file,
  onRemoveTag,
}: FileMetadataCardProps) {
  return (
    <Card className="space-y-6">
      <div>
        <h2 className="text-xs font-semibold uppercase tracking-wider text-ink-subtle">
          File
        </h2>
        <p className="mt-1 text-lg font-semibold leading-snug text-ink">
          {file.name}
        </p>
      </div>

      <dl className="grid gap-4 sm:grid-cols-2">
        <div>
          <dt className="text-xs font-medium uppercase tracking-wider text-ink-subtle">
            Category
          </dt>
          <dd className="mt-1">
            <Badge variant="neutral">{file.category}</Badge>
          </dd>
        </div>
        <div>
          <dt className="text-xs font-medium uppercase tracking-wider text-ink-subtle">
            Source type
          </dt>
          <dd className="mt-1">
            <Badge variant="muted">{file.sourceType}</Badge>
          </dd>
        </div>
        <div>
          <dt className="text-xs font-medium uppercase tracking-wider text-ink-subtle">
            Upload date
          </dt>
          <dd className="mt-1 text-sm text-ink">
            {formatRecordDate(file.uploadedAt)}
          </dd>
        </div>
        <div>
          <dt className="text-xs font-medium uppercase tracking-wider text-ink-subtle">
            File type
          </dt>
          <dd className="mt-1 text-sm uppercase text-ink">{file.fileType}</dd>
        </div>
        <div className="sm:col-span-2">
          <dt className="text-xs font-medium uppercase tracking-wider text-ink-subtle">
            Processing status
          </dt>
          <dd className="mt-1">
            <FileStatusBadge status={file.status} />
          </dd>
        </div>
      </dl>

      <div>
        <h3 className="text-xs font-semibold uppercase tracking-wider text-ink-subtle">
          Tags
        </h3>
        <div className="mt-2">
          <FileTags tags={file.tags} onRemove={onRemoveTag} />
        </div>
      </div>
    </Card>
  );
}
