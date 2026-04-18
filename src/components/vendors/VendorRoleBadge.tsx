import { Badge } from "@/components/ui/Badge";

export function VendorRoleBadge({ role }: { role: string }) {
  return (
    <Badge variant="muted" className="max-w-[280px] truncate font-normal" title={role}>
      {role}
    </Badge>
  );
}
