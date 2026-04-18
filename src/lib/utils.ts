export function cn(
  ...parts: Array<string | undefined | null | false>
): string {
  return parts.filter(Boolean).join(" ");
}

export function fileExtensionFromName(name: string): string {
  const dot = name.lastIndexOf(".");
  if (dot < 0) return "file";
  const ext = name.slice(dot + 1).toLowerCase();
  return ext || "file";
}
