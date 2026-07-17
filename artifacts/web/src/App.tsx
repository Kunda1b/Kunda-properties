import { Suspense } from "react";
import { Route, Switch } from "wouter";
import { Toaster } from "react-hot-toast";
import { Providers } from "@/components/providers";
import { DashboardNav } from "@/components/layout/DashboardNav";
import { useAuthStore } from "@/lib/store/auth.store";

// Pages — public
import HomePage from "@/pages/home";
import ListingsPage from "@/pages/listings";
import ListingDetailPage from "@/pages/listing-detail";
import HowItWorksPage from "@/pages/how-it-works";
import AboutPage from "@/pages/about";
import ContactPage from "@/pages/contact";
import PrivacyPage from "@/pages/privacy";
import TermsPage from "@/pages/terms";
import LoginPage from "@/pages/auth/login";
import RegisterPage from "@/pages/auth/register";
import ForgotPasswordPage from "@/pages/auth/forgot-password";
import AuthCallbackPage from "@/pages/auth/callback";
import { AgentsListPage, AgentProfilePage } from "@/pages/agents";
import NotFound from "@/pages/not-found";

// Pages — dashboard
import DashboardPage from "@/pages/dashboard/index";
import MyListingsPage from "@/pages/dashboard/listings";
import NewListingPage from "@/pages/dashboard/listings/new";
import EditListingPage from "@/pages/dashboard/listings/edit";
import OffersPage from "@/pages/dashboard/offers";
import EscrowPage from "@/pages/dashboard/escrow";
import KycPage from "@/pages/dashboard/kyc";
import ProfilePage from "@/pages/dashboard/profile";
import NotificationsPage from "@/pages/dashboard/notifications";
import DocumentsPage from "@/pages/dashboard/documents";
import MessagesPage from "@/pages/dashboard/messages";
import ViewingsPage from "@/pages/dashboard/viewings";

function DashboardLayout({ children }: { children: React.ReactNode }) {
  const user = useAuthStore((s) => s.user);
  if (!user) {
    window.location.href = "/auth/login";
    return null;
  }
  return (
    <div className="min-h-screen bg-gray-50 flex">
      <DashboardNav />
      <main className="flex-1 ml-0 lg:ml-64 p-6 pt-20 lg:pt-6">{children}</main>
    </div>
  );
}

function ListingsPageWrapper() {
  const params = new URLSearchParams(window.location.search);
  const searchParams: Record<string, string | undefined> = {};
  params.forEach((v, k) => { searchParams[k] = v; });
  return <ListingsPage searchParams={searchParams} />;
}

function Router() {
  return (
    <Switch>
      {/* Public */}
      <Route path="/" component={HomePage} />
      <Route path="/listings" component={ListingsPageWrapper} />
      <Route path="/listings/:id">
        {(params) => <ListingDetailPage id={params.id} />}
      </Route>
      <Route path="/agents" component={AgentsListPage} />
      <Route path="/agents/:id">
        {(params) => <AgentProfilePage id={params.id} />}
      </Route>
      <Route path="/auth/login" component={LoginPage} />
      <Route path="/auth/register" component={RegisterPage} />
      <Route path="/auth/callback" component={AuthCallbackPage} />

      {/* Dashboard */}
      <Route path="/dashboard">
        <DashboardLayout><DashboardPage /></DashboardLayout>
      </Route>
      <Route path="/dashboard/listings/new">
        <DashboardLayout><NewListingPage /></DashboardLayout>
      </Route>
      <Route path="/dashboard/listings/edit/:id">
        {(params) => <DashboardLayout><EditListingPage id={params.id} /></DashboardLayout>}
      </Route>
      <Route path="/dashboard/listings">
        <DashboardLayout><MyListingsPage /></DashboardLayout>
      </Route>
      <Route path="/dashboard/offers">
        <DashboardLayout><OffersPage /></DashboardLayout>
      </Route>
      <Route path="/dashboard/escrow">
        <DashboardLayout><EscrowPage /></DashboardLayout>
      </Route>
      <Route path="/dashboard/kyc">
        <DashboardLayout><KycPage /></DashboardLayout>
      </Route>
      <Route path="/dashboard/documents">
        <DashboardLayout><DocumentsPage /></DashboardLayout>
      </Route>
      <Route path="/dashboard/notifications">
        <DashboardLayout><NotificationsPage /></DashboardLayout>
      </Route>
      <Route path="/dashboard/messages">
        <DashboardLayout><MessagesPage /></DashboardLayout>
      </Route>
      <Route path="/dashboard/viewings">
        <DashboardLayout><ViewingsPage /></DashboardLayout>
      </Route>
      <Route path="/dashboard/profile">
        <DashboardLayout><ProfilePage /></DashboardLayout>
      </Route>

      <Route component={NotFound} />
    </Switch>
  );
}

export default function App() {
  return (
    <Providers>
      <Router />
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: { background: "#1a5c3e", color: "#fff", borderRadius: "8px" },
          error: { style: { background: "#c41a1a" } },
        }}
      />
    </Providers>
  );
}
