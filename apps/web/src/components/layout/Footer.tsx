import Link from "next/link";

const LINKS = {
  Platform: [
    { label: "Browse listings", href: "/listings" },
    { label: "How it works", href: "/how-it-works" },
    { label: "List a property", href: "/agents" },
    { label: "Saved properties", href: "/dashboard/saved" },
  ],
  "For agents": [
    { label: "Agent sign up", href: "/agents/register" },
    { label: "Agent dashboard", href: "/agents/dashboard" },
    { label: "Verification process", href: "/agents/verify" },
  ],
  Company: [
    { label: "About Kunda", href: "/about" },
    { label: "Contact us", href: "/contact" },
    { label: "Privacy policy", href: "/privacy" },
    { label: "Terms of service", href: "/terms" },
  ],
};

export default function Footer() {
  return (
    <footer className="border-t border-kunda-border bg-white/60 backdrop-blur-md">
      <div className="mx-auto max-w-6xl px-5 py-14">
        <div className="mb-12 grid grid-cols-2 gap-10 md:grid-cols-4">
          {/* Brand Column */}
          <div className="col-span-2 md:col-span-1">
            <Link href="/" className="mb-4 flex items-center gap-2.5 group">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-kunda-forest to-kunda-forest-deep shadow-sm transition-transform duration-200 group-hover:scale-105">
                <span className="text-xs font-bold text-white">K</span>
              </div>
              <span className="font-semibold text-kunda-ink tracking-tight">
                Kunda Properties
              </span>
            </Link>
            <p className="mb-5 max-w-xs text-sm leading-relaxed text-kunda-muted">
              The trusted property platform for the Gambian diaspora. Find,
              verify, and invest from anywhere in the world.
            </p>
            <div className="flex items-center gap-2.5">
              <span className="badge badge-green">
                🇬🇲 The Gambia
              </span>
              <span className="text-xs text-kunda-muted">·</span>
              <span className="text-xs text-kunda-muted">Est. 2025</span>
            </div>
          </div>

          {/* Link Columns */}
          {Object.entries(LINKS).map(([group, items]) => (
            <div key={group}>
              <h3 className="mb-4 text-xs font-semibold uppercase tracking-[0.2em] text-kunda-ink">
                {group}
              </h3>
              <ul className="space-y-2.5">
                {items.map((item) => (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className="text-sm text-kunda-muted transition-colors duration-200 hover:text-kunda-forest"
                    >
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom Bar */}
        <div className="flex flex-col items-center justify-between gap-4 border-t border-kunda-border pt-8 sm:flex-row">
          <p className="text-xs text-kunda-muted">
            © {new Date().getFullYear()} Kunda Properties. All rights reserved.
          </p>
          <div className="flex items-center gap-5 text-xs text-kunda-muted">
            <span>Built for the Gambian diaspora</span>
            <span>·</span>
            <a
              href="mailto:hello@kundaproperties.gm"
              className="transition-colors duration-200 hover:text-kunda-forest"
            >
              hello@kundaproperties.gm
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
