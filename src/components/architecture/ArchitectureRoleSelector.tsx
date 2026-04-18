import { Select } from "@/components/ui/Select";
import { ARCHITECTURE_COMPONENT_ROLES, type ArchitectureComponentRole } from "@/types";

type ArchitectureRoleSelectorProps = {
  value: ArchitectureComponentRole;
  onChange: (role: ArchitectureComponentRole) => void;
  ariaLabel?: string;
};

export function ArchitectureRoleSelector({
  value,
  onChange,
  ariaLabel = "Component role",
}: ArchitectureRoleSelectorProps) {
  return (
    <Select
      className="max-w-xs py-1.5 text-xs"
      value={value}
      onChange={(e) =>
        onChange(e.target.value as ArchitectureComponentRole)
      }
      aria-label={ariaLabel}
    >
      {ARCHITECTURE_COMPONENT_ROLES.map((r) => (
        <option key={r} value={r}>
          {r}
        </option>
      ))}
    </Select>
  );
}
