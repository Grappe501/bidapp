import { Badge, type BadgeVariant } from "@/components/ui/Badge";
import { formatFileProcessingStatusLabel } from "@/lib/display-format";
import type { FileProcessingStatus } from "@/types";

const STATUS_VARIANT: Record<FileProcessingStatus, BadgeVariant> = {
  Uploaded: "muted",
  Queued: "neutral",
  Processed: "emphasis",
  "Needs Review": "warning",
  Error: "warning",
};

export function FileStatusBadge({ status }: { status: FileProcessingStatus }) {
  return (
    <Badge variant={STATUS_VARIANT[status]}>
      {formatFileProcessingStatusLabel(status)}
    </Badge>
  );
}
