import { Search, Shield, Key } from "lucide-react";
const steps = [
  { icon: Search, title: "1. Find Your Property", body: "Browse verified listings across all regions of The Gambia." },
  { icon: Shield, title: "2. Secure with Escrow", body: "Funds held safely until you've inspected and are fully satisfied." },
  { icon: Key,    title: "3. Complete the Transfer", body: "Funds released, title deed transferred. Safe and simple." },
];
export function HowItWorks() {
  return (
    <section className="py-20 bg-gray-50">
      <div className="container mx-auto px-4">
        <div className="text-center mb-14"><h2 className="section-title">How Kunda Works</h2></div>
        <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
          {steps.map(({ icon: Icon, title, body }) => (
            <div key={title} className="bg-white rounded-2xl p-8 text-center shadow-sm border border-gray-100">
              <div className="w-14 h-14 rounded-2xl bg-kunda-50 text-kunda-700 flex items-center justify-center mx-auto mb-5">
                <Icon className="w-7 h-7" />
              </div>
              <h3 className="font-display text-xl font-bold text-gray-900 mb-3">{title}</h3>
              <p className="text-gray-500 leading-relaxed text-sm">{body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
