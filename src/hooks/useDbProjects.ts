import { useEffect, useState } from "react";
import { dbProjectToProject, fetchDbProjects, type DbProjectRow } from "@/lib/functions-api";
import type { Project } from "@/types";

export function useDbProjects() {
  const enabled = Boolean(
    (import.meta.env.VITE_FUNCTIONS_BASE_URL ?? "").trim(),
  );
  const [rows, setRows] = useState<DbProjectRow[] | null>(null);
  const [loading, setLoading] = useState(enabled);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!enabled) {
      setLoading(false);
      setRows(null);
      return;
    }
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      const list = await fetchDbProjects();
      if (cancelled) return;
      if (list === null) {
        setRows(null);
        setError("Could not reach list-projects (check CORS, URL, and DB).");
      } else {
        setRows(list);
      }
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [enabled]);

  const projects: Project[] | null =
    rows === null ? null : rows.map(dbProjectToProject);

  return { projects, rows, loading, error, functionsEnabled: enabled };
}
