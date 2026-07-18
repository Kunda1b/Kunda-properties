import { useQuery } from "@tanstack/react-query";
import { Home, DollarSign, FileText, Bell, Plus, ArrowRight, Loader2 } from "lucide-react";
import { Link } from "wouter";
import { useAuthStore } from "@/lib/store/auth.store";
import { escrowApi, listingsApi, offersApi, notificationsApi } from "@/lib/api";
import { formatPrice } from "@/lib/utils";

function StatCardSkeleton() {
  return (
    <div className="bg-white rounded-xl p-5 border border-gray-100 animate-pulse">
      <div className="w-5 h-5 bg-gray-200 rounded mb-2" />
      <div className="h-8 bg-gray-200 rounded w-12 mb-1" />
      <div className="h-4 bg-gray-100 rounded w-20" />
    </div>
  );
}

const STATUS_BADGE: Record<string, string> = {
  ACTIVE: "bg-green-100 text-green-700",
  PENDING: "bg-yellow-100 text-yellow-700",
  DRAFT: "bg-gray-100 text-gray-600",
  SOLD: "bg-blue-100 text-blue-700",
  UNDER_OFFER: "bg-orange-100 text-orange-700",
};

export default function DashboardPage() {
  const user = useAuthStore((s) => s.user);

  const { data: myListings, isLoading: loadingListings } = useQuery({
    queryKey: ["my-listings"],
    queryFn: () => listingsApi.getMine().then((r) => r.data.data),
    retry: 1,
  });

  const { data: myEscrows, isLoading: loadingEscrows } = useQuery({
    queryKey: ["my-escrows"],
    queryFn: () => escrowApi.getMine().then((r) => r.data.data),
    retry: 1,
  });

  const { data: myOffers, isLoading: loadingOffers } = useQuery({
    queryKey: ["my-offers"],
    queryFn: () => offersApi.getMine().then((r) => r.data.data),
    retry: 1,
  });

  const { data: myNotifications, isLoading: loadingNotifications } = useQuery({
    queryKey: ["my-notifications-dash"],
    queryFn: () => notificationsApi.getAll({ limit: 20 }).then((r) => r.data.data),
    retry: 1,
  });

  const isLoading = loadingListings || loadingEscrows || loadingOffers || loadingNotifications;

  const listingsCount = myListings?.listings?.length ?? 0;
  const escrowsCount = myEscrows?.escrows?.length ?? 0;
  const offersCount = myOffers?.offers?.length ?? 0;
  const notifCount = (myNotifications?.notifications ?? myNotifications?.items ?? []).filter(
    (n: any) => n.status === "SENT"
  ).length;

  const recentListings = (myListings?.listings ?? []).slice(0, 3);

  return (
    <div className="max-w-6xl mx-auto">
      <h1 className="font-display text-3xl font-bold text-gray-900 mb-2">
        Welcome back, {user?.profile?.firstName || "there"} 👋
      </h1>

      {/* KYC banner */}
      {user?.kyc?.status !== "VERIFIED" && (
        <div className="bg-sand-50 border border-sand-200 rounded-xl p-4 my-6 flex items-center justify-between">
          <p className="font-semibold text-gray-900 text-sm">Complete your identity verification</p>
          <Link href="/dashboard/kyc" className="btn-primary text-sm py-2 px-4">Verify Now</Link>
        </div>
      )}

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-8">
        {isLoading ? (
          <>
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
          </>
        ) : (
          <>
            <Link href="/dashboard/listings" className="bg-white rounded-xl p-5 border border-gray-100 hover:border-kunda-200 transition-colors">
              <Home className="w-5 h-5 text-blue-600 mb-2" />
              <p className="text-2xl font-bold text-gray-900">{listingsCount}</p>
              <p className="text-gray-500 text-sm">My Listings</p>
            </Link>
            <Link href="/dashboard/escrow" className="bg-white rounded-xl p-5 border border-gray-100 hover:border-kunda-200 transition-colors">
              <DollarSign className="w-5 h-5 text-kunda-700 mb-2" />
              <p className="text-2xl font-bold text-gray-900">{escrowsCount}</p>
              <p className="text-gray-500 text-sm">Active Escrows</p>
            </Link>
            <Link href="/dashboard/offers" className="bg-white rounded-xl p-5 border border-gray-100 hover:border-kunda-200 transition-colors">
              <FileText className="w-5 h-5 text-sand-400 mb-2" />
              <p className="text-2xl font-bold text-gray-900">{offersCount}</p>
              <p className="text-gray-500 text-sm">My Offers</p>
            </Link>
            <Link href="/dashboard/notifications" className="bg-white rounded-xl p-5 border border-gray-100 hover:border-kunda-200 transition-colors">
              <Bell className="w-5 h-5 text-orange-500 mb-2" />
              <p className="text-2xl font-bold text-gray-900">{notifCount}</p>
              <p className="text-gray-500 text-sm">Notifications</p>
            </Link>
          </>
        )}
      </div>

      {/* Empty state CTAs */}
      {!isLoading && (listingsCount === 0 || escrowsCount === 0) && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6">
          {listingsCount === 0 && (
            <div className="bg-kunda-50 border border-kunda-100 rounded-xl p-5 flex items-center justify-between">
              <div>
                <p className="font-semibold text-gray-900 text-sm mb-1">No listings yet</p>
                <p className="text-gray-500 text-xs">Start selling by listing your first property</p>
              </div>
              <Link
                href="/dashboard/listings/new"
                className="flex items-center gap-1.5 bg-kunda-700 text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-kunda-800 transition-colors whitespace-nowrap"
              >
                <Plus className="w-4 h-4" /> List Property
              </Link>
            </div>
          )}
          {escrowsCount === 0 && (
            <div className="bg-sand-50 border border-sand-100 rounded-xl p-5 flex items-center justify-between">
              <div>
                <p className="font-semibold text-gray-900 text-sm mb-1">No active escrows</p>
                <p className="text-gray-500 text-xs">Browse properties and make an offer</p>
              </div>
              <Link
                href="/listings"
                className="flex items-center gap-1.5 bg-sand-400 text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-sand-500 transition-colors whitespace-nowrap"
              >
                Browse <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          )}
        </div>
      )}

      {/* Recent Listings */}
      <div className="mt-8 bg-white rounded-2xl border border-gray-100 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display text-xl font-bold text-gray-900">Recent Listings</h2>
          <Link href="/dashboard/listings" className="text-sm text-kunda-600 hover:text-kunda-700 flex items-center gap-1">
            View all <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {loadingListings ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-14 bg-gray-100 animate-pulse rounded-lg" />
            ))}
          </div>
        ) : recentListings.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-400 text-sm mb-3">You haven't listed any properties yet</p>
            <Link
              href="/dashboard/listings/new"
              className="inline-flex items-center gap-2 text-sm text-kunda-700 font-medium hover:underline"
            >
              <Plus className="w-4 h-4" /> List your first property
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {recentListings.map((listing: any) => (
              <div key={listing.id} className="flex items-center justify-between p-3 rounded-lg border border-gray-100 hover:bg-gray-50 transition-colors">
                <div className="flex-1 min-w-0 mr-3">
                  <p className="text-sm font-medium text-gray-900 truncate">{listing.title}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{formatPrice(Number(listing.price), listing.currency)}</p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${STATUS_BADGE[listing.status] || "bg-gray-100 text-gray-600"}`}>
                    {listing.status?.replace(/_/g, " ")}
                  </span>
                  <Link
                    href={`/listings/${listing.slug || listing.id}`}
                    className="text-xs text-kunda-600 hover:text-kunda-700 font-medium"
                  >
                    View
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
