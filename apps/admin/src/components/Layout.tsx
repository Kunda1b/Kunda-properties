import { Badge } from "@kunda/ui";
import { NavLink, Outlet } from "react-router-dom";

const navItems = [
  { path: "/dashboard", label: "Dashboard" },
  { path: "/kyc", label: "KYC queue" },
  { path: "/listings", label: "Listings" },
  { path: "/escrow", label: "Escrow" },
  { path: "/analytics", label: "Analytics" },
];

export default function Layout() {
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand-block">
          <div className="brand-mark">KP</div>
          <div>
            <div className="brand-title">Kunda Admin</div>
            <div className="brand-subtitle">Ops, review, and oversight</div>
          </div>
        </div>

        <div className="sidebar-status">
          <Badge tone="forest">VPN only</Badge>
          <Badge tone="gold">Registry checks on</Badge>
        </div>

        <nav className="sidebar-nav">
          {navItems.map((item) => (
            <NavLink
              className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}
              key={item.path}
              to={item.path}
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
      </aside>

      <main className="content">
        <Outlet />
      </main>
    </div>
  );
}
