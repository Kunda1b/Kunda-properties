import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Route, Switch, Router as WouterRouter, useLocation } from "wouter";
import { Toaster } from "react-hot-toast";
import { useState } from "react";
import { AdminSidebar } from "@/components/AdminSidebar";
import { useAdminStore } from "@/lib/store/admin.store";
import { useIdleTimeout } from "@/hooks/use-idle-timeout";

// Pages
import LoginPage from "@/pages/login";
import DashboardPage from "@/pages/dashboard";
import UsersPage from "@/pages/users";
import KycPage from "@/pages/kyc";
import ListingsPage from "@/pages/listings";
import EscrowPage from "@/pages/escrow";
import DocumentsPage from "@/pages/documents";
import AnalyticsPage from "@/pages/analytics";
import NotificationsPage from "@/pages/notifications";
import AuditLogsPage from "@/pages/audit-logs";
import SettingsPage from "@/pages/settings";
import NotFound from "@/pages/not-found";

const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 60000, retry: 1, refetchOnWindowFocus: false } },
});

function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = useAdminStore((s) => s.user);
  useIdleTimeout();

  if (!user || (user.role !== "ADMIN" && user.role !== "SUPER_ADMIN")) {
    window.location.href = import.meta.env.BASE_URL + "login";
    return null;
  }
  return (
    <div className="min-h-screen bg-gray-50 flex">
      <AdminSidebar />
      <main className="flex-1 ml-64 p-8">{children}</main>
    </div>
  );
}

function Router() {
  return (
    <Switch>
      <Route path="/login" component={LoginPage} />
      <Route path="/">
        <AdminLayout><DashboardPage /></AdminLayout>
      </Route>
      <Route path="/users">
        <AdminLayout><UsersPage /></AdminLayout>
      </Route>
      <Route path="/kyc">
        <AdminLayout><KycPage /></AdminLayout>
      </Route>
      <Route path="/listings">
        <AdminLayout><ListingsPage /></AdminLayout>
      </Route>
      <Route path="/escrow">
        <AdminLayout><EscrowPage /></AdminLayout>
      </Route>
      <Route path="/documents">
        <AdminLayout><DocumentsPage /></AdminLayout>
      </Route>
      <Route path="/analytics">
        <AdminLayout><AnalyticsPage /></AdminLayout>
      </Route>
      <Route path="/notifications">
        <AdminLayout><NotificationsPage /></AdminLayout>
      </Route>
      <Route path="/audit-logs">
        <AdminLayout><AuditLogsPage /></AdminLayout>
      </Route>
      <Route path="/settings">
        <AdminLayout><SettingsPage /></AdminLayout>
      </Route>
      <Route component={NotFound} />
    </Switch>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
        <Router />
      </WouterRouter>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: { background: "#1a5c3e", color: "#fff", borderRadius: "8px" },
          error: { style: { background: "#c41a1a" } },
        }}
      />
    </QueryClientProvider>
  );
}
