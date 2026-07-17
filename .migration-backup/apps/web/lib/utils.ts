import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
export function cn(...inputs: ClassValue[]) { return twMerge(clsx(inputs)); }

export function formatPrice(amount: number, currency: string): string {
  try { return new Intl.NumberFormat("en-GB", { style: "currency", currency, minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(amount); }
  catch { return `${currency} ${amount.toLocaleString()}`; }
}
export function formatArea(sqm: number): string {
  if (sqm >= 10000) return `${(sqm/10000).toFixed(1)} ha`;
  return `${sqm.toLocaleString()} m²`;
}
export function formatRelativeTime(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  const s = Math.floor((Date.now() - d.getTime()) / 1000);
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s/60)}m ago`;
  if (s < 86400) return `${Math.floor(s/3600)}h ago`;
  if (s < 604800) return `${Math.floor(s/86400)}d ago`;
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}
export function getInitials(f: string, l: string) { return `${f[0]||""}${l[0]||""}`.toUpperCase(); }

export const PROPERTY_TYPE_LABELS: Record<string,string> = { HOUSE:"House", APARTMENT:"Apartment", LAND:"Land", COMMERCIAL:"Commercial", VILLA:"Villa", COMPOUND:"Compound" };
export const ESCROW_STATUS_LABELS: Record<string,{label:string,color:string}> = {
  INITIATED:{label:"Initiated",color:"bg-blue-100 text-blue-700"}, FUNDED:{label:"Funded",color:"bg-yellow-100 text-yellow-700"},
  INSPECTING:{label:"Inspection Period",color:"bg-orange-100 text-orange-700"}, APPROVED:{label:"Approved",color:"bg-green-100 text-green-700"},
  DISPUTED:{label:"Disputed",color:"bg-red-100 text-red-700"}, RELEASED:{label:"Complete",color:"bg-kunda-100 text-kunda-700"},
  REFUNDED:{label:"Refunded",color:"bg-gray-100 text-gray-600"}, CANCELLED:{label:"Cancelled",color:"bg-gray-100 text-gray-500"},
};
