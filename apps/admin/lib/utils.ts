import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
export function cn(...inputs: ClassValue[]) { return twMerge(clsx(inputs)); }
export function formatPrice(amount: number, currency = "USD") {
  try { return new Intl.NumberFormat("en-GB", { style: "currency", currency, minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(amount); }
  catch { return `${currency} ${amount.toLocaleString()}`; }
}
export function formatDate(d: Date | string) { return new Date(d).toLocaleDateString("en-GB", { day:"numeric", month:"short", year:"numeric" }); }
export function formatDateTime(d: Date | string) { return new Date(d).toLocaleString("en-GB", { day:"numeric", month:"short", year:"numeric", hour:"2-digit", minute:"2-digit" }); }
export function formatRelativeTime(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  const s = Math.floor((Date.now() - d.getTime()) / 1000);
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s/60)}m ago`;
  if (s < 86400) return `${Math.floor(s/3600)}h ago`;
  if (s < 604800) return `${Math.floor(s/86400)}d ago`;
  return formatDate(d);
}
export function getInitials(f = "", l = "") { return (`${f[0]||""}${l[0]||""}`).toUpperCase() || "?"; }

export const KYC_BADGES: Record<string,string> = { VERIFIED:"badge-green", PENDING:"badge-gray", SUBMITTED:"badge-yellow", REJECTED:"badge-red", EXPIRED:"badge-orange" };
export const LISTING_STATUS_BADGES: Record<string,string> = { ACTIVE:"badge-green", DRAFT:"badge-gray", PENDING_REVIEW:"badge-yellow", UNDER_OFFER:"badge-blue", SOLD:"badge-purple", WITHDRAWN:"badge-gray", SUSPENDED:"badge-red" };
export const ESCROW_STATUS_BADGES: Record<string,{cls:string,label:string}> = {
  INITIATED:{cls:"badge-blue",label:"Initiated"}, FUNDED:{cls:"badge-yellow",label:"Funded"}, INSPECTING:{cls:"badge-orange",label:"Inspection"},
  APPROVED:{cls:"badge-green",label:"Approved"}, DISPUTED:{cls:"badge-red",label:"Disputed"}, RELEASED:{cls:"badge-green",label:"Released"},
  REFUNDED:{cls:"badge-gray",label:"Refunded"}, CANCELLED:{cls:"badge-gray",label:"Cancelled"},
};
export const USER_ROLE_BADGES: Record<string,string> = { ADMIN:"badge-purple", AGENT:"badge-blue", SELLER:"badge-orange", BUYER:"badge-green" };
