import axios from "axios";
import { useAdminStore } from "@/lib/store/admin.store";
const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

export const api = axios.create({ baseURL: `${BASE_URL}/api`, timeout: 30000, headers: { "Content-Type": "application/json" } });
api.interceptors.request.use((config) => {
  const token = useAdminStore.getState().accessToken;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

let refreshing = false;
api.interceptors.response.use((r) => r, async (error) => {
  if (error.response?.status === 401 && !error.config._retry) {
    if (refreshing) return Promise.reject(error);
    refreshing = true; error.config._retry = true;
    try {
      const { refreshToken, setTokens, logout } = useAdminStore.getState();
      if (!refreshToken) throw new Error("no refresh token");
      const { data } = await axios.post(`${BASE_URL}/api/auth/refresh`, { refreshToken });
      setTokens(data.data.accessToken, data.data.refreshToken);
      error.config.headers.Authorization = `Bearer ${data.data.accessToken}`;
      return api(error.config);
    } catch {
      useAdminStore.getState().logout();
      if (typeof window !== "undefined") window.location.href = "/";
      return Promise.reject(error);
    } finally { refreshing = false; }
  }
  return Promise.reject(error);
});

export const adminApi = {
  stats: () => api.get("/admin/stats"),
  getUsers: (p?: any) => api.get("/admin/users", { params: p }),
  getUser: (id: string) => api.get(`/admin/users/${id}`),
  suspendUser: (id: string) => api.patch(`/admin/users/${id}/suspend`),
  activateUser: (id: string) => api.patch(`/admin/users/${id}/activate`),
  promoteToAgent: (id: string) => api.patch(`/admin/users/${id}/role`, { role: "AGENT" }),
  getPendingKyc: (p?: any) => api.get("/admin/kyc/pending", { params: p }),
  approveKyc: (id: string) => api.patch(`/admin/kyc/${id}/manual-verify`),
  rejectKyc: (id: string, reason: string) => api.patch(`/admin/kyc/${id}/reject`, { reason }),
  getPendingListings: (p?: any) => api.get("/admin/listings/pending", { params: p }),
  getAllListings: (p?: any) => api.get("/admin/listings", { params: p }),
  approveListing: (id: string) => api.patch(`/admin/listings/${id}/approve`),
  rejectListing: (id: string) => api.patch(`/admin/listings/${id}/reject`),
  suspendListing: (id: string) => api.patch(`/admin/listings/${id}/suspend`),
  featureListing: (id: string) => api.patch(`/admin/listings/${id}/feature`),
  getAllEscrows: (p?: any) => api.get("/admin/escrow", { params: p }),
  getEscrow: (id: string) => api.get(`/admin/escrow/${id}`),
  forceRelease: (id: string, notes: string) => api.patch(`/admin/escrow/${id}/force-release`, { notes }),
  forceRefund: (id: string, notes: string) => api.patch(`/admin/escrow/${id}/force-refund`, { notes }),
  getPendingDocs: (p?: any) => api.get("/admin/documents/pending", { params: p }),
  verifyDoc: (id: string) => api.patch(`/admin/documents/${id}/verify`, { status: "VERIFIED" }),
  rejectDoc: (id: string, reason: string) => api.patch(`/admin/documents/${id}/verify`, { status: "REJECTED", reason }),
  broadcast: (data: any) => api.post("/admin/notifications/broadcast", data),
  getNotifs: (p?: any) => api.get("/admin/notifications", { params: p }),
  getAuditLogs: (p?: any) => api.get("/admin/audit-logs", { params: p }),
  updateRate: (from: string, to: string, rate: number) => api.put("/admin/exchange-rates", { from, to, rate }),
  getRates: () => api.get("/admin/exchange-rates"),
};
