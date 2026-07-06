import Link from "next/link";
export function Footer() {
  return (
    <footer className="bg-kunda-950 text-white py-16">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-12">
          <div>
            <h3 className="font-display text-2xl font-bold mb-4">Kunda<span className="text-sand-400">.</span></h3>
            <p className="text-white/60 text-sm leading-relaxed">Building bridges between the Gambian diaspora and home.</p>
            <p className="text-white/40 text-xs mt-4">🇬🇲 Made with love for The Gambia</p>
          </div>
          {[
            { title: "Platform", links: [["Properties","listings"],["How It Works","how-it-works"]] },
            { title: "Company",  links: [["About","about"],["Contact","contact"]] },
            { title: "Legal",    links: [["Privacy","privacy"],["Terms","terms"]] },
          ].map(({ title, links }) => (
            <div key={title}>
              <h4 className="font-semibold text-sm mb-4 text-white/80 uppercase tracking-wider">{title}</h4>
              <ul className="space-y-2">
                {links.map(([label, href]) => (
                  <li key={label}><Link href={`/${href}`} className="text-white/60 text-sm hover:text-white">{label}</Link></li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="border-t border-white/10 pt-8 text-center text-white/40 text-sm">
          © {new Date().getFullYear()} Kunda Properties. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
