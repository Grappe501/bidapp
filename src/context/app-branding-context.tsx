import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { useProjectWorkspace } from "@/context/project-workspace-context";
import {
  isFunctionsApiConfigured,
  postGetBrandingProfile,
  type BrandingProfileApi,
} from "@/lib/functions-api";

type AppBrandingContextValue = {
  branding: BrandingProfileApi | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
};

const AppBrandingContext = createContext<AppBrandingContextValue | null>(null);

/**
 * Loads AllCare / client branding for shell and demo surfaces (best-effort).
 */
export function AppBrandingProvider({ children }: { children: ReactNode }) {
  const { projectId } = useProjectWorkspace();
  const [branding, setBranding] = useState<BrandingProfileApi | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!projectId || !isFunctionsApiConfigured()) {
      setBranding(null);
      setError(null);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const r = await postGetBrandingProfile({
        projectId,
        ensureProfile: false,
      });
      setBranding(r.branding);
    } catch (e) {
      setBranding(null);
      setError(e instanceof Error ? e.message : "Branding unavailable");
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    void load();
  }, [load]);

  const value: AppBrandingContextValue = {
    branding,
    loading,
    error,
    refetch: load,
  };

  return (
    <AppBrandingContext.Provider value={value}>
      {children}
    </AppBrandingContext.Provider>
  );
}

export function useAppBranding(): AppBrandingContextValue {
  const v = useContext(AppBrandingContext);
  if (!v) {
    throw new Error("useAppBranding must be used within AppBrandingProvider");
  }
  return v;
}
