import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { SessionProvider } from "@/components/session/SessionProvider";

export default function DashboardLayout({ children }: LayoutProps<"/dashboard">) {
  return (
    <SessionProvider>
      <DashboardShell>{children}</DashboardShell>
    </SessionProvider>
  );
}
