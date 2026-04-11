"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { apiRequest } from "@/lib/api";

type AgentListing = {
  id: string;
  status: string;
};

type DashboardStats = {
  totalListings: number;
  publishedListings: number;
  pendingReview: number;
  totalEnquiries: number;
};

const CHECKLIST_KEY = "kunda_agent_checklist_dismissed";

export default function AgentDashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [listings, setListings] = useState<AgentListing[]>([]);

  useEffect(() => {
    Promise.all([
      apiRequest<{ data: AgentListing[] }>("/api/listings/my"),
    ])
      .then(([listingsRes]) => {
        const items = listingsRes.data;
        setListings(items);
        setStats({
          totalListings: items.length,
          publishedListings: items.filter((l) => l.status === "PUBLISHED").length,
          pendingReview: items.filter((l) => l.status === "PENDING_REVIEW").length,
          totalEnquiries: 0,
        });
      })
      .catch(() => {
        setStats({
          totalListings: 0,
          publishedListings: 0,
          pendingReview: 0,
          totalEnquiries: 0,
        });
      })
      .finally(() => setLoading(false));
  }, []);

  const recentListings = listings.slice(0, 3);

  return (
    <div className="space-y-8">
      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className="h-28 rounded-2xl bg-gray-100 animate-pulse"
            />
          ))}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            label="Total listings"
            value={stats?.totalListings ?? 0}
            icon={
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                <polyline points="9 22 9 12 15 12 15 22" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            }
          />
          <StatCard
            label="Published"
            value={stats?.publishedListings ?? 0}
            icon={
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.8" />
              </svg>
            }
            highlight
          />
          <StatCard
            label="Under review"
            value={stats?.pendingReview ?? 0}
            icon={
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.8" />
                <polyline points="12 6 12 12 16 14" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            }
          />
          <StatCard
            label="Total enquiries"
            value={stats?.totalEnquiries ?? 0}
            icon={
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            }
          />
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-gray-900">
              Recent listings
            </h2>
            <Link
              href="/agents/listings"
              className="text-sm font-medium hover:underline"
              style={{ color: "var(--kunda-green)" }}
            >
              View all
            </Link>
          </div>

          {loading ? (
            <div className="space-y-3">
              {[...Array(2)].map((_, i) => (
                <div
                  key={i}
                  className="h-20 rounded-xl bg-gray-100 animate-pulse"
                />
              ))}
            </div>
          ) : recentListings.length === 0 ? (
            <div className="rounded-2xl border border-gray-100 bg-white p-8 text-center">
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3"
                style={{ backgroundColor: "var(--kunda-green-light)" }}
              >
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                  <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" stroke="#0F6E56" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                  <polyline points="9 22 9 12 15 12 15 22" stroke="#0F6E56" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <p className="text-sm font-medium text-gray-900 mb-1">
                No listings yet
              </p>
              <p className="text-xs text-gray-500 mb-4">
                Add your first property to get started
              </p>
              <Link
                href="/agents/listings/new"
                className="inline-block px-5 py-2.5 rounded-xl text-white text-sm font-medium hover:opacity-90 transition-opacity"
                style={{ backgroundColor: "var(--kunda-green)" }}
              >
                Add listing
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {recentListings.map((listing) => (
                <Link
                  key={listing.id}
                  href={`/agents/listings/${listing.id}/edit`}
                  className="block rounded-xl border border-gray-100 bg-white p-4 hover:border-gray-200 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-900 mb-0.5">
                        Listing #{listing.id.slice(0, 8)}
                      </p>
                      <span
                        className="text-xs font-medium px-2 py-0.5 rounded-full"
                        style={{
                          backgroundColor:
                            listing.status === "PUBLISHED"
                              ? "#E1F5EE"
                              : listing.status === "PENDING_REVIEW"
                                ? "#FAEEDA"
                                : "#F1EFE8",
                          color:
                            listing.status === "PUBLISHED"
                              ? "#085041"
                              : listing.status === "PENDING_REVIEW"
                                ? "#633806"
                                : "#444441",
                        }}
                      >
                        {listing.status === "PUBLISHED"
                          ? "Published"
                          : listing.status === "PENDING_REVIEW"
                            ? "Under review"
                            : listing.status === "DRAFT"
                              ? "Draft"
                              : listing.status}
                      </span>
                    </div>
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      className="text-gray-400"
                    >
                      <path
                        d="M9 18l6-6-6-6"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-4">
          <h2 className="text-base font-semibold text-gray-900">
            Quick actions
          </h2>
          <div className="space-y-2">
            <Link
              href="/agents/listings/new"
              className="flex items-center gap-3 p-4 rounded-xl border border-gray-100 bg-white hover:border-gray-200 transition-colors"
            >
              <div
                className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: "var(--kunda-green-light)" }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <path d="M12 5v14M5 12h14" stroke="#0F6E56" strokeWidth="2" strokeLinecap="round" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">
                  Add new listing
                </p>
                <p className="text-xs text-gray-500">Create a property listing</p>
              </div>
            </Link>

            <Link
              href="/agents/verify"
              className="flex items-center gap-3 p-4 rounded-xl border border-gray-100 bg-white hover:border-gray-200 transition-colors"
            >
              <div
                className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: "#FAEEDA" }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" stroke="#633806" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">
                  Verification status
                </p>
                <p className="text-xs text-gray-500">Check required documents</p>
              </div>
            </Link>

            <Link
              href="/dashboard/enquiries"
              className="flex items-center gap-3 p-4 rounded-xl border border-gray-100 bg-white hover:border-gray-200 transition-colors"
            >
              <div
                className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: "#E6F1FB" }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" stroke="#0C447C" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">
                  View enquiries
                </p>
                <p className="text-xs text-gray-500">Respond to buyer messages</p>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  icon,
  highlight,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
  highlight?: boolean;
}) {
  return (
    <div
      className="rounded-2xl p-5"
      style={{
        backgroundColor: highlight ? "var(--kunda-green)" : "white",
        border: highlight ? "none" : "1px solid #f3f4f6",
      }}
    >
      <div className="flex items-center justify-between mb-3">
        <span
          className="text-xs font-medium"
          style={{
            color: highlight ? "rgba(255,255,255,0.7)" : "#6b7280",
          }}
        >
          {label}
        </span>
        <span
          style={{ color: highlight ? "rgba(255,255,255,0.6)" : "#d1d5db" }}
        >
          {icon}
        </span>
      </div>
      <p
        className="text-3xl font-semibold"
        style={{ color: highlight ? "white" : "#111827" }}
      >
        {value}
      </p>
    </div>
  );
}
