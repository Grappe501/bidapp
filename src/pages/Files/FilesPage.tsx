import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useWorkspace } from "@/context/useWorkspace";
import {
  FileFilterBar,
  type FileLibraryFilters,
} from "@/components/files/FileFilterBar";
import { FileLibraryTable } from "@/components/files/FileLibraryTable";
import { FileUploadPanel } from "@/components/files/FileUploadPanel";

const defaultFilters: FileLibraryFilters = {
  category: "all",
  sourceType: "all",
  status: "all",
  search: "",
};

export function FilesPage() {
  const navigate = useNavigate();
  const { files, addUploadedFiles } = useWorkspace();
  const [filters, setFilters] = useState<FileLibraryFilters>(defaultFilters);

  const filtered = useMemo(() => {
    const q = filters.search.trim().toLowerCase();
    return files.filter((f) => {
      if (filters.category !== "all" && f.category !== filters.category) {
        return false;
      }
      if (filters.sourceType !== "all" && f.sourceType !== filters.sourceType) {
        return false;
      }
      if (filters.status !== "all" && f.status !== filters.status) {
        return false;
      }
      if (q && !f.name.toLowerCase().includes(q)) {
        return false;
      }
      return true;
    });
  }, [files, filters]);

  return (
    <div className="p-8">
      <div className="mx-auto max-w-6xl space-y-8">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-ink">
            File library
          </h1>
          <p className="mt-1 max-w-2xl text-sm text-ink-muted">
            Central record of solicitation materials, partner inputs, and working
            drafts. Rows load from the database for the active project; new uploads
            are session-only until a file-create API is wired.
          </p>
        </div>

        <FileUploadPanel onUpload={addUploadedFiles} />

        <div className="space-y-4">
          <FileFilterBar value={filters} onChange={setFilters} />
          <FileLibraryTable
            files={filtered}
            onOpen={(f) => navigate(`/files/${f.id}`)}
          />
        </div>
      </div>
    </div>
  );
}
