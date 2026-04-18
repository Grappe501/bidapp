import { Badge } from "@/components/ui/Badge";
import { formatRequirementTagLabel } from "@/lib/display-format";
import type { RequirementTagType } from "@/types";

export function RequirementTagBadge({ tag }: { tag: RequirementTagType }) {
  return (
    <Badge variant="neutral" className="font-normal">
      {formatRequirementTagLabel(tag)}
    </Badge>
  );
}
