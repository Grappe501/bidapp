import type { ReactNode } from "react";
import { DemoModeBanner } from "@/components/demo/DemoModeBanner";
import { PrivateDeployBanner } from "@/components/PrivateDeployBanner";
import { WorkspaceStatusBanner } from "@/components/WorkspaceStatusBanner";
import { useDemoMode } from "@/context/demo-mode-context";
import { Header } from "./Header";
import { Sidebar } from "./Sidebar";

type AppLayoutProps = {
  children: ReactNode;
};

export function AppLayout({ children }: AppLayoutProps) {
  const { isDemoMode } = useDemoMode();

  return (
    <div className="min-h-screen bg-surface">
      <Sidebar />
      <div className="pl-56">
        <Header />
        <DemoModeBanner />
        {!isDemoMode ? <PrivateDeployBanner /> : null}
        <WorkspaceStatusBanner />
        <main className="min-h-[calc(100vh-3.5rem)]">{children}</main>
      </div>
    </div>
  );
}
