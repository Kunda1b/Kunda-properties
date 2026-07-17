import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { agentsApi, messagesApi } from "@/lib/api";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { PropertyCard } from "@/components/ui/PropertyCard";
import { useAuthStore } from "@/lib/store/auth.store";
import { formatPrice } from "@/lib/utils";
import { MapPin, MessageSquare, Building2, Eye, Award, Loader2, X, Send, ArrowLeft } from "lucide-react";
import toast from "react-hot-toast";

function ContactModal({ agent, listingId, onClose }: { agent: any; listingId?: string; onClose: () => void }) {
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);

  const handleSend = async () => {
    if (!message.trim()) return;
    setSending(true);
    try {
      await messagesApi.start({
        listingId: listingId || agent.listings?.[0]?.id,
        message,
        subject: `Enquiry for ${agent.firstName} ${agent.lastName}`,
      });
      toast.success("Message sent!");
      onClose();
    } catch (e: any) {
      toast.error(e?.response?.data?.error || "Failed to send");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <h2 className="font-display text-xl font-bold text-gray-900">Contact {agent.firstName}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-6 space-y-4">
          <textarea value={message} onChange={(e) => setMessage(e.target.value)}
            rows={4} className="input-field resize-none"
            placeholder="Hi, I'm interested in your properties. Please send me more information…" />
          <button onClick={handleSend} disabled={!message.trim() || sending}
            className="btn-primary w-full flex items-center justify-center gap-2">
            {sending && <Loader2 className="w-4 h-4 animate-spin" />} <Send className="w-4 h-4" /> Send Message
          </button>
        </div>
      </div>
    </div>
  );
}

export function AgentProfilePage({ id }: { id: string }) {
  const [showContact, setShowContact] = useState(false);
  const user = useAuthStore((s) => s.user);

  const { data, isLoading, isError } = useQuery({
    queryKey: ["agent", id],
    queryFn: () => agentsApi.getOne(id).then((r) => r.data.data),
    enabled: !!id,
    retry: 1,
  });

  if (isLoading) return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="pt-24 container mx-auto px-4 py-8 max-w-5xl">
        <div className="animate-pulse space-y-6">
          <div className="h-32 bg-gray-100 rounded-2xl" />
          <div className="grid md:grid-cols-3 gap-6">
            {[1,2,3].map((i) => <div key={i} className="h-72 bg-gray-100 rounded-2xl" />)}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );

  if (isError) return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="pt-24 container mx-auto px-4 py-8 max-w-5xl text-center">
        <p className="text-4xl mb-4">⚠️</p>
        <h2 className="font-display text-xl font-bold text-gray-900 mb-2">Failed to load agent</h2>
        <p className="text-sm text-gray-500 mb-4">Please try again later</p>
        <Link href="/agents" className="btn-primary inline-flex mt-4">Browse Agents</Link>
      </main>
      <Footer />
    </div>
  );

  if (!data) return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="pt-24 container mx-auto px-4 py-8 max-w-5xl text-center">
        <p className="text-5xl mb-4">👤</p>
        <h2 className="font-display text-xl font-bold text-gray-900 mb-2">Agent not found</h2>
        <Link href="/agents" className="btn-primary inline-flex mt-4">Browse Agents</Link>
      </main>
      <Footer />
    </div>
  );

  const { agent, listings, stats } = data;

  return (
    <div className="min-h-screen bg-gray-50">
      {showContact && <ContactModal agent={agent} listingId={listings?.[0]?.id} onClose={() => setShowContact(false)} />}
      <Navbar />
      <main className="pt-24 container mx-auto px-4 py-8 max-w-5xl">
        <Link href="/agents" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-kunda-700 mb-6">
          <ArrowLeft className="w-4 h-4" /> All Agents
        </Link>

        {/* Agent header */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6 md:p-8 mb-6">
          <div className="flex flex-col md:flex-row items-start gap-6">
            <div className="w-20 h-20 rounded-full bg-kunda-700 flex items-center justify-center text-white text-2xl font-bold flex-shrink-0">
              {agent.firstName?.[0] || "A"}{agent.lastName?.[0] || ""}
            </div>
            <div className="flex-1">
              <h1 className="font-display text-2xl font-bold text-gray-900">
                {agent.firstName} {agent.lastName}
              </h1>
              <div className="flex items-center gap-1 text-sm text-gray-500 mt-1">
                <MapPin className="w-4 h-4" />
                <span>{agent.city || "The Gambia"}{agent.country ? `, ${agent.country}` : ""}</span>
              </div>
              {agent.languages?.length > 0 && (
                <div className="flex gap-1 mt-2">
                  {agent.languages.map((lang: string) => (
                    <span key={lang} className="badge bg-kunda-50 text-kunda-700 text-xs">{lang}</span>
                  ))}
                </div>
              )}
              {agent.bio && <p className="text-sm text-gray-600 mt-3 leading-relaxed">{agent.bio}</p>}
            </div>
            <div className="flex flex-col items-center gap-3">
              <button onClick={() => setShowContact(true)}
                className="btn-primary flex items-center gap-2">
                <MessageSquare className="w-4 h-4" /> Contact
              </button>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t border-gray-100">
            <div className="text-center">
              <p className="text-2xl font-bold text-kunda-700">{stats?.totalListings || 0}</p>
              <p className="text-xs text-gray-500">Properties</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-kunda-700">{stats?.soldCount || 0}</p>
              <p className="text-xs text-gray-500">Sold</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-kunda-700">{stats?.totalViews || 0}</p>
              <p className="text-xs text-gray-500">Total Views</p>
            </div>
          </div>
        </div>

        {/* Listings */}
        <h2 className="font-display text-xl font-bold text-gray-900 mb-4">
          Properties by {agent.firstName}
        </h2>
        {listings?.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {listings.map((l: any, i: number) => (
              <PropertyCard key={l.id} listing={l} index={i} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12 bg-white rounded-xl border border-gray-100">
            <Building2 className="w-8 h-8 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 text-sm">No active listings</p>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}

export function AgentsListPage() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["agents-list"],
    queryFn: () => agentsApi.getAll().then((r) => r.data.data),
    retry: 1,
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="pt-24 container mx-auto px-4 py-8 max-w-5xl">
        <h1 className="font-display text-2xl font-bold text-gray-900 mb-6">Our Agents & Sellers</h1>

        {isError && (
          <div className="text-center py-20">
            <Building2 className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">Failed to load agents</p>
            <p className="text-xs text-gray-400 mt-2">Please try again later</p>
          </div>
        )}

        {isLoading && (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1,2,3,4,5,6].map((i) => <div key={i} className="h-40 bg-gray-100 animate-pulse rounded-2xl" />)}
          </div>
        )}

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {(data || []).map((agent: any) => (
            <Link key={agent.id} href={`/agents/${agent.id}`}
              className="bg-white rounded-2xl border border-gray-100 p-5 hover:border-kunda-200 transition-colors block">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-full bg-kunda-700 flex items-center justify-center text-white text-lg font-bold flex-shrink-0">
                  {agent.firstName?.[0] || "A"}{agent.lastName?.[0] || ""}
                </div>
                <div className="min-w-0">
                  <p className="font-medium text-gray-900 truncate">{agent.firstName} {agent.lastName}</p>
                  <p className="text-xs text-gray-500">{agent.city || "The Gambia"}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-kunda-700 font-medium">{agent.listingsCount || 0} listings</span>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {!isLoading && (!data || data.length === 0) && (
          <div className="text-center py-20">
            <Building2 className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No agents or sellers found</p>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
