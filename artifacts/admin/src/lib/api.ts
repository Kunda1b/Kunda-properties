import axios, { AxiosError, AxiosRequestConfig } from "axios";
import { useAdminStore } from "@/lib/store/admin.store";

const BASE_URL = import.meta.env.VITE_API_URL || "";

export const adminApi = axios.create({
  baseURL: `${BASE_URL}/api/admin`,
  timeout: 30000,
  headers: { "Content-Type": "application/json" },
});

adminApi.interceptors.request.use((config) => {
  const token = useAdminStore.getState().accessToken;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

adminApi.interceptors.response.use(
  (res) => res,
  async (error: AxiosError) => {
    if (error.response?.status === 401) {
      useAdminStore.getState().logout();
      window.location.href = "/admin/login";
    }
    return Promise.reject(error);
  }
);

// Auth — uses regular API for login (admin auth is role-based)
export const authApi = {
  login: (d: any) => axios.post(`${BASE_URL}/api/auth/login`, d),
  getMe: () => axios.get(`${BASE_URL}/api/auth/me`),
};

// Users
export const usersApi = {
  getAll: (p?: any) => adminApi.get("/users", { params: p }),
  suspend: (id: string) => adminApi.patch(`/users/${id}/suspend`, { suspend: true }),
  restore: (id: string) => adminApi.patch(`/users/${id}/suspend`, { suspend: false }),
};

// KYC
export const kycAdminApi = {
  getPending: (p?: any) => adminApi.get("/kyc", { params: p }),
  verify: (id: string) => adminApi.patch(`/kyc/${id}/verify`),
  reject: (id: string, reason?: string) => adminApi.patch(`/kyc/${id}/reject`, { reason }),
};

// Listings
export const listingsAdminApi = {
  getAll: (p?: any) => adminApi.get("/listings", { params: p }),
  approve: (id: string) => adminApi.patch(`/listings/${id}/approve`),
  reject: (id: string) => adminApi.patch(`/listings/${id}/reject`),
  verify: (id: string, d?: any) => adminApi.patch(`/listings/${id}/verify`, d),
  suspend: (id: string) => adminApi.patch(`/listings/${id}/suspend`),
};

// Escrow
export const escrowAdminApi = {
  getAll: (p?: any) => adminApi.get("/escrow", { params: p }),
  forceRelease: (id: string, notes: string) => adminApi.patch(`/escrow/${id}/force-release`, { notes }),
  forceRefund: (id: string, notes: string) => adminApi.patch(`/escrow/${id}/force-refund`, { notes }),
};

// Documents
export const documentsAdminApi = {
  getAll: (p?: any) => adminApi.get("/documents", { params: p }),
};

// Analytics
export const analyticsApi = {
  getOverview: () => adminApi.get("/stats"),
  getDetails: () => adminApi.get("/analytics"),
};

// Notifications
export const notificationsAdminApi = {
  send: (d: any) => adminApi.post("/notifications/broadcast", d),
};

// Audit
export const auditApi = {
  getAll: (p?: any) => adminApi.get("/audit-logs", { params: p }),
};

export const exchangeRatesAdminApi = {
  getAll: () => adminApi.get("/exchange-rates"),
  update: (id: string, rate: number) => adminApi.patch(`/exchange-rates/${id}`, { rate }),
};
