import { BrowserRouter } from "react-router-dom";
import { ArchitectureProvider } from "@/context/ArchitectureProvider";
import { ControlProvider } from "@/context/ControlProvider";
import { DraftingProvider } from "@/context/DraftingProvider";
import { EvidenceProvider } from "@/context/EvidenceProvider";
import { IntelligenceProvider } from "@/context/IntelligenceProvider";
import { RequirementProvider } from "@/context/RequirementProvider";
import { VendorProvider } from "@/context/VendorProvider";
import { WorkspaceProvider } from "@/context/WorkspaceProvider";
import { AppRoutes } from "./routes";
import { AppLayout } from "./layout/AppLayout";

export function App() {
  return (
    <BrowserRouter>
      <WorkspaceProvider>
        <RequirementProvider>
          <EvidenceProvider>
            <VendorProvider>
              <ArchitectureProvider>
                <ControlProvider>
                  <IntelligenceProvider>
                    <DraftingProvider>
                      <AppLayout>
                        <AppRoutes />
                      </AppLayout>
                    </DraftingProvider>
                  </IntelligenceProvider>
                </ControlProvider>
              </ArchitectureProvider>
            </VendorProvider>
          </EvidenceProvider>
        </RequirementProvider>
      </WorkspaceProvider>
    </BrowserRouter>
  );
}
