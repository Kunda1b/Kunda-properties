import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) { return twMerge(clsx(inputs)); }

export function formatPrice(amount: number, currency: string): string {
  try {
    return new Intl.NumberFormat("en-GB", { style: "currency", currency, minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(amount);
  } catch { return `${currency} ${amount.toLocaleString()}`; }
}

export function formatRelativeTime(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  const s = Math.floor((Date.now() - d.getTime()) / 1000);
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

export const KYC_STATUS_COLORS: Record<string, string> = {
  PENDING: "bg-gray-100 text-gray-600",
  SUBMITTED: "bg-yellow-100 text-yellow-700",
  VERIFIED: "bg-green-100 text-green-700",
  REJECTED: "bg-red-100 text-red-700",
};

export const LISTING_STATUS_COLORS: Record<string, string> = {
  DRAFT: "bg-gray-100 text-gray-600",
  PENDING_REVIEW: "bg-yellow-100 text-yellow-700",
  ACTIVE: "bg-green-100 text-green-700",
  REJECTED: "bg-red-100 text-red-700",
  SOLD: "bg-blue-100 text-blue-700",
  DEACTIVATED: "bg-gray-100 text-gray-500",
};

export const ESCROW_STATUS_COLORS: Record<string, string> = {
  INITIATED: "bg-blue-100 text-blue-700",
  FUNDED: "bg-yellow-100 text-yellow-700",
  INSPECTING: "bg-orange-100 text-orange-700",
  APPROVED: "bg-green-100 text-green-700",
  DISPUTED: "bg-red-100 text-red-700",
  RELEASED: "bg-kunda-100 text-kunda-700",
  REFUNDED: "bg-gray-100 text-gray-600",
  CANCELLED: "bg-gray-100 text-gray-500",
};
