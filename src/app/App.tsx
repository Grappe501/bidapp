import { BrowserRouter } from "react-router-dom";
import { SystemConfigGate } from "@/components/SystemConfigGate";
import { AppBrandingProvider } from "@/context/app-branding-context";
import { ArchitectureProvider } from "@/context/ArchitectureProvider";
import { ControlProvider } from "@/context/ControlProvider";
import { DraftingProvider } from "@/context/DraftingProvider";
import { OutputProvider } from "@/context/OutputProvider";
import { ReviewProvider } from "@/context/ReviewProvider";
import { StrategyProvider } from "@/context/StrategyProvider";
import { SubmissionProvider } from "@/context/SubmissionProvider";
import { EvidenceProvider } from "@/context/EvidenceProvider";
import { IntelligenceProvider } from "@/context/IntelligenceProvider";
import { RequirementProvider } from "@/context/RequirementProvider";
import { VendorProvider } from "@/context/VendorProvider";
import { WorkspaceProvider } from "@/context/WorkspaceProvider";
import { ProjectWorkspaceProvider } from "@/context/project-workspace-context";
import { AppRoutes } from "./routes";
import { AppLayout } from "./layout/AppLayout";

export function App() {
  return (
    <SystemConfigGate>
      <BrowserRouter>
        <ProjectWorkspaceProvider>
          <AppBrandingProvider>
              <WorkspaceProvider>
                <RequirementProvider>
                  <EvidenceProvider>
                    <VendorProvider>
                      <ArchitectureProvider>
                        <ControlProvider>
                          <IntelligenceProvider>
                            <DraftingProvider>
                              <ReviewProvider>
                                <OutputProvider>
                                  <SubmissionProvider>
                                    <StrategyProvider>
                                      <AppLayout>
                                        <AppRoutes />
                                      </AppLayout>
                                    </StrategyProvider>
                                  </SubmissionProvider>
                                </OutputProvider>
                              </ReviewProvider>
                            </DraftingProvider>
                          </IntelligenceProvider>
                        </ControlProvider>
                      </ArchitectureProvider>
                    </VendorProvider>
                  </EvidenceProvider>
                </RequirementProvider>
              </WorkspaceProvider>
          </AppBrandingProvider>
        </ProjectWorkspaceProvider>
      </BrowserRouter>
    </SystemConfigGate>
  );
}
