import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Menu, X } from "lucide-react";
import { useAuthStore } from "@/lib/store/auth.store";

export function Navbar() {
  const [open, setOpen] = useState(false);
  const [, navigate] = useLocation();
  const { user, logout } = useAuthStore();

  const handleLogout = () => { logout(); navigate("/"); };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md shadow-sm">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16 md:h-20">
          <Link href="/" className="font-display text-2xl font-bold text-kunda-700">Kunda<span className="text-sand-400">.</span></Link>
          <nav className="hidden md:flex items-center gap-8">
            <Link href="/listings" className="text-sm font-medium text-gray-700 hover:text-kunda-600">Properties</Link>
            <Link href="/how-it-works" className="text-sm font-medium text-gray-700 hover:text-kunda-600">How It Works</Link>
          </nav>
          <div className="hidden md:flex items-center gap-3">
            {user ? (
              <>
                <Link href="/dashboard" className="text-sm font-medium text-gray-700">Dashboard</Link>
                <button onClick={handleLogout} className="text-sm text-red-600">Sign Out</button>
              </>
            ) : (
              <>
                <Link href="/auth/login" className="text-sm font-medium text-gray-700">Sign In</Link>
                <Link href="/auth/register" className="btn-primary text-sm py-2 px-5">Get Started</Link>
              </>
            )}
          </div>
          <button onClick={() => setOpen(!open)} className="md:hidden p-2 text-gray-700">
            {open ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>
      {open && (
        <div className="md:hidden bg-white border-t border-gray-100 px-4 pb-6 pt-4 space-y-2">
          <Link href="/listings" onClick={() => setOpen(false)} className="block py-2 text-gray-700 font-medium">Properties</Link>
          <Link href="/how-it-works" onClick={() => setOpen(false)} className="block py-2 text-gray-700 font-medium">How It Works</Link>
          {user ? (
            <Link href="/dashboard" onClick={() => setOpen(false)} className="btn-primary block text-center mt-2">Dashboard</Link>
          ) : (
            <>
              <Link href="/auth/login" onClick={() => setOpen(false)} className="btn-outline block text-center">Sign In</Link>
              <Link href="/auth/register" onClick={() => setOpen(false)} className="btn-primary block text-center mt-2">Get Started</Link>
            </>
          )}
        </div>
      )}
    </header>
  );
}
