"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useHydrated } from "@/hooks/use-hydrated";
import { useSavedListings } from "@/store/savedListings";

const NAV_LINKS = [
  { href: "/listings", label: "Browse" },
  { href: "/how-it-works", label: "How it works" },
  { href: "/agents", label: "List property" },
];

export default function Navbar() {
  const hydrated = useHydrated();
  const { saved } = useSavedListings();
  const savedCount = hydrated ? saved.length : 0;
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  return (
    <header
      className={`sticky top-0 z-50 w-full transition-all duration-300 ${
        scrolled
          ? "border-b border-kunda-border bg-white/80 shadow-nav backdrop-blur-xl"
          : "border-b border-transparent bg-transparent"
      }`}
    >
      <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-3.5">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-kunda-forest to-kunda-forest-deep shadow-md transition-transform duration-200 group-hover:scale-105">
            <span className="text-sm font-bold text-white tracking-wide">K</span>
          </div>
          <span className="text-lg font-semibold text-kunda-ink tracking-tight">
            Kunda
          </span>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden items-center gap-1 md:flex">
          {NAV_LINKS.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`rounded-lg px-3.5 py-2 text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? "bg-kunda-forest-soft text-kunda-forest"
                    : "text-kunda-muted hover:bg-kunda-forest-soft/50 hover:text-kunda-ink"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        {/* Desktop Actions */}
        <div className="hidden items-center gap-2 md:flex">
          <Link
            href="/dashboard/saved"
            className="relative flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-kunda-muted transition-all duration-200 hover:bg-kunda-forest-soft/50 hover:text-kunda-ink"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="shrink-0">
              <path
                d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            Saved
            {savedCount > 0 && (
              <span className="flex h-4.5 w-4.5 items-center justify-center rounded-full bg-kunda-forest text-[10px] font-bold text-white">
                {savedCount}
              </span>
            )}
          </Link>

          <Link
            href="/dashboard/kyc"
            className="text-xs px-2 py-1 rounded-full font-medium hidden md:block"
            style={{
              backgroundColor: "var(--kunda-green-light)",
              color: "var(--kunda-green)",
            }}
          >
            Verify ID
          </Link>

          <Link
            href="/auth/signin"
            className="rounded-lg px-3.5 py-2 text-sm font-medium text-kunda-muted transition-all duration-200 hover:text-kunda-ink"
          >
            Sign in
          </Link>

          <Link href="/auth/register" className="btn-primary text-sm">
            Get started
          </Link>
        </div>

        {/* Mobile Hamburger */}
        <button
          type="button"
          onClick={() => setMobileOpen(!mobileOpen)}
          className="flex h-10 w-10 items-center justify-center rounded-xl text-kunda-muted transition-colors hover:bg-kunda-forest-soft md:hidden"
          aria-label="Toggle menu"
        >
          {mobileOpen ? (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          ) : (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M3 12h18M3 6h18M3 18h18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          )}
        </button>
      </div>

      {/* Mobile Menu */}
      {mobileOpen && (
        <div className="border-t border-kunda-border bg-white/95 backdrop-blur-xl md:hidden animate-slide-up">
          <div className="mx-auto max-w-6xl space-y-1 px-5 py-4">
            {NAV_LINKS.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`block rounded-xl px-4 py-3 text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-kunda-forest-soft text-kunda-forest"
                      : "text-kunda-muted hover:bg-kunda-forest-soft/50"
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
            <Link
              href="/dashboard/saved"
              className="flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-medium text-kunda-muted hover:bg-kunda-forest-soft/50"
            >
              Saved {savedCount > 0 && `(${savedCount})`}
            </Link>
            <div className="flex gap-2 pt-2">
              <Link href="/auth/signin" className="btn-secondary flex-1 justify-center text-sm">
                Sign in
              </Link>
              <Link href="/auth/register" className="btn-primary flex-1 justify-center text-sm">
                Get started
              </Link>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
