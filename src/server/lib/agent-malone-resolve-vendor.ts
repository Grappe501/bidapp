import { listVendorsByProject } from "../repositories/vendor.repo";

export type ResolvedVendor =
  | { ok: true; vendorId: string; vendorName: string }
  | { ok: false; message: string };

/**
 * Resolves vendor for Malone actions: explicit id, single-vendor project,
 * or name match in the user message.
 */
export async function resolveVendorForMaloneAction(input: {
  projectId: string;
  selectedVendorId?: string | null;
  question?: string;
}): Promise<ResolvedVendor> {
  const vendors = await listVendorsByProject(input.projectId);
  if (vendors.length === 0) {
    return { ok: false, message: "No vendors in this project." };
  }

  const explicit = input.selectedVendorId?.trim();
  if (explicit) {
    const v = vendors.find((x) => x.id === explicit);
    if (v) return { ok: true, vendorId: v.id, vendorName: v.name };
    return { ok: false, message: "The selected vendor is not valid for this project." };
  }

  if (vendors.length === 1) {
    const v = vendors[0];
    return { ok: true, vendorId: v.id, vendorName: v.name };
  }

  const q = (input.question ?? "").toLowerCase();
  if (q.trim()) {
    let best: { id: string; name: string; score: number } | null = null;
    for (const v of vendors) {
      const name = v.name.toLowerCase();
      if (q.includes(name) || name.split(/\s+/).some((w) => w.length > 2 && q.includes(w))) {
        const score = name.length;
        if (!best || score > best.score) {
          best = { id: v.id, name: v.name, score };
        }
      }
    }
    if (best) {
      return { ok: true, vendorId: best.id, vendorName: best.name };
    }
  }

  return {
    ok: false,
    message:
      "Multiple vendors exist — open Agent Malone from a vendor page (add ?vendorId=…) or name the vendor in your message.",
  };
}
