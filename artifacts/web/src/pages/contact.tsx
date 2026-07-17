import { useState } from "react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Mail, MessageSquare, MapPin, Loader2, CheckCircle } from "lucide-react";

export default function ContactPage() {
  const [form, setForm] = useState({ name: "", email: "", subject: "", message: "" });
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    // Simulate send — replace with real API call when email service is configured
    await new Promise((r) => setTimeout(r, 900));
    setSent(true);
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <main className="pt-20">
        <section className="bg-gradient-to-br from-kunda-950 to-kunda-700 text-white py-16 px-4 text-center">
          <p className="text-sand-400 font-medium text-sm uppercase tracking-widest mb-4">Contact</p>
          <h1 className="font-display text-4xl font-bold mb-4">Get in touch</h1>
          <p className="text-white/70 max-w-xl mx-auto">Have a question about a listing, need help with an escrow, or want to list your property? We're here to help.</p>
        </section>

        <section className="py-20 px-4">
          <div className="container mx-auto max-w-5xl grid md:grid-cols-2 gap-16">
            {/* Form */}
            <div>
              <h2 className="font-display text-2xl font-bold text-gray-900 mb-6">Send us a message</h2>
              {sent ? (
                <div className="bg-green-50 rounded-2xl p-8 text-center border border-green-200">
                  <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
                  <h3 className="font-display text-xl font-bold text-gray-900 mb-2">Message sent!</h3>
                  <p className="text-gray-500">We'll get back to you within 1–2 business days.</p>
                  <button onClick={() => { setSent(false); setForm({ name: "", email: "", subject: "", message: "" }); }}
                    className="mt-6 text-sm text-kunda-600 hover:text-kunda-700">Send another message</button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                      <input className="input-field" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Your name" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                      <input className="input-field" type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="you@example.com" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
                    <select className="input-field" value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} required>
                      <option value="">Select a topic…</option>
                      <option>Buying a property</option>
                      <option>Listing my property</option>
                      <option>Escrow / payment question</option>
                      <option>KYC verification</option>
                      <option>Technical issue</option>
                      <option>Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Message</label>
                    <textarea className="input-field resize-none" rows={5} required value={form.message}
                      onChange={(e) => setForm({ ...form, message: e.target.value })}
                      placeholder="Tell us how we can help…" />
                  </div>
                  <button type="submit" disabled={loading} className="btn-primary w-full flex items-center justify-center gap-2">
                    {loading && <Loader2 className="w-4 h-4 animate-spin" />} Send Message
                  </button>
                </form>
              )}
            </div>

            {/* Contact info */}
            <div className="space-y-8">
              <h2 className="font-display text-2xl font-bold text-gray-900">Other ways to reach us</h2>
              {[
                { icon: Mail, label: "Email", value: "hello@kunda.gm", href: "mailto:hello@kunda.gm" },
                { icon: MessageSquare, label: "WhatsApp", value: "+220 XXX XXXX", href: "#" },
                { icon: MapPin, label: "Based in", value: "Banjul, The Gambia & London, UK", href: null },
              ].map(({ icon: Icon, label, value, href }) => (
                <div key={label} className="flex gap-4">
                  <div className="w-11 h-11 rounded-xl bg-kunda-50 flex items-center justify-center flex-shrink-0">
                    <Icon className="w-5 h-5 text-kunda-700" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">{label}</p>
                    {href ? (
                      <a href={href} className="text-gray-900 font-medium hover:text-kunda-700">{value}</a>
                    ) : (
                      <p className="text-gray-900 font-medium">{value}</p>
                    )}
                  </div>
                </div>
              ))}

              <div className="bg-kunda-50 rounded-2xl p-6">
                <h3 className="font-display text-lg font-bold text-gray-900 mb-2">Support hours</h3>
                <p className="text-gray-600 text-sm leading-relaxed">
                  Monday – Friday: 9am – 6pm GMT<br />
                  Saturday: 10am – 2pm GMT<br />
                  Response time: within 24 hours
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
