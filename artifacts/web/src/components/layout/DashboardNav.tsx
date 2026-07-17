import { Link, useLocation } from "wouter";
import { Home, Building2, DollarSign, Shield, User, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/lib/store/auth.store";

const links = [
  { href: "/dashboard", icon: Home, label: "Overview" },
  { href: "/dashboard/listings", icon: Building2, label: "My Listings" },
  { href: "/dashboard/escrow", icon: DollarSign, label: "Escrow" },
  { href: "/dashboard/kyc", icon: Shield, label: "Verification" },
  { href: "/dashboard/profile", icon: User, label: "Profile" },
];

export function DashboardNav() {
  const [pathname] = useLocation();
  const { user, logout } = useAuthStore();

  return (
    <aside className="fixed left-0 top-0 h-full w-64 bg-white border-r border-gray-100 z-40 hidden lg:flex flex-col">
      <div className="p-6 border-b border-gray-100">
        <Link href="/" className="font-display text-xl font-bold text-kunda-700">Kunda<span className="text-sand-400">.</span></Link>
      </div>
      <nav className="flex-1 p-4 space-y-1">
        {links.map(({ href, icon: Icon, label }) => (
          <Link key={href} href={href} className={cn(
            "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium",
            pathname === href ? "bg-kunda-50 text-kunda-700" : "text-gray-600 hover:bg-gray-50"
          )}>
            <Icon className="w-4 h-4" />{label}
          </Link>
        ))}
      </nav>
      <div className="p-4 border-t border-gray-100">
        <div className="flex items-center gap-3 px-3 py-2 mb-1">
          <div className="w-8 h-8 rounded-full bg-kunda-700 flex items-center justify-center text-white text-sm font-bold">
            {user?.profile?.firstName?.[0] || "U"}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">{user?.profile?.firstName} {user?.profile?.lastName}</p>
          </div>
        </div>
        <button onClick={logout} className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-red-600 hover:bg-red-50 w-full">
          <LogOut className="w-4 h-4" /> Sign Out
        </button>
      </div>
    </aside>
  );
}
