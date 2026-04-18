import type { ArchitectureOption, Vendor } from "@/types";

export function getRecommendedOption(
  options: ArchitectureOption[],
): ArchitectureOption | undefined {
  return options.find((o) => o.recommended);
}

export function sortArchitectureOptions(
  options: ArchitectureOption[],
): ArchitectureOption[] {
  return [...options].sort((a, b) => {
    if (a.recommended !== b.recommended) return a.recommended ? -1 : 1;
    const statusOrder = (s: ArchitectureOption["status"]) => {
      if (s === "Recommended") return 0;
      if (s === "Under Review") return 1;
      if (s === "Draft") return 2;
      return 3;
    };
    const d = statusOrder(a.status) - statusOrder(b.status);
    if (d !== 0) return d;
    return a.name.localeCompare(b.name, undefined, { sensitivity: "base" });
  });
}

export function vendorIdsInArchitectureOption(option: ArchitectureOption): string[] {
  return [...new Set(option.components.map((c) => c.vendorId))];
}

export function architectureOptionsUsingVendor(
  options: ArchitectureOption[],
  vendorId: string,
): ArchitectureOption[] {
  return options.filter((o) =>
    o.components.some((c) => c.vendorId === vendorId),
  );
}

export function enrichComponentVendorNames(
  option: ArchitectureOption,
  vendors: Vendor[],
): ArchitectureOption {
  const map = new Map(vendors.map((v) => [v.id, v.name]));
  return {
    ...option,
    components: option.components.map((c) => ({
      ...c,
      vendorName: map.get(c.vendorId) ?? c.vendorName,
    })),
  };
}
