import type { ReactNode } from "react";
import { WorkspaceStatusBanner } from "@/components/WorkspaceStatusBanner";
import { Header } from "./Header";
import { Sidebar } from "./Sidebar";

type AppLayoutProps = {
  children: ReactNode;
};

export function AppLayout({ children }: AppLayoutProps) {
  return (
    <div className="min-h-screen bg-surface">
      <Sidebar />
      <div className="pl-56">
        <Header />
        <WorkspaceStatusBanner />
        <main className="min-h-[calc(100vh-3.5rem)]">{children}</main>
      </div>
    </div>
  );
}
