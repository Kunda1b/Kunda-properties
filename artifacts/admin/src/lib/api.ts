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

// Auth
export const authApi = {
  login: (d: any) => axios.post(`${BASE_URL}/api/auth/login`, d),
  getMe: () => adminApi.get("/me"),
};

// Users
export const usersApi = {
  getAll: (p?: any) => adminApi.get("/users", { params: p }),
  getOne: (id: string) => adminApi.get(`/users/${id}`),
  update: (id: string, d: any) => adminApi.patch(`/users/${id}`, d),
  suspend: (id: string) => adminApi.post(`/users/${id}/suspend`),
  restore: (id: string) => adminApi.post(`/users/${id}/restore`),
};

// KYC
export const kycAdminApi = {
  getPending: (p?: any) => adminApi.get("/kyc", { params: p }),
  getOne: (id: string) => adminApi.get(`/kyc/${id}`),
  verify: (id: string, d: any) => adminApi.post(`/kyc/${id}/verify`, d),
};

// Listings
export const listingsAdminApi = {
  getAll: (p?: any) => adminApi.get("/listings", { params: p }),
  getOne: (id: string) => adminApi.get(`/listings/${id}`),
  approve: (id: string, d?: any) => adminApi.post(`/listings/${id}/approve`, d),
  reject: (id: string, d?: any) => adminApi.post(`/listings/${id}/reject`, d),
  deactivate: (id: string) => adminApi.post(`/listings/${id}/deactivate`),
};

// Escrow
export const escrowAdminApi = {
  getAll: (p?: any) => adminApi.get("/escrow", { params: p }),
  getOne: (id: string) => adminApi.get(`/escrow/${id}`),
  release: (id: string) => adminApi.post(`/escrow/${id}/release`),
  refund: (id: string) => adminApi.post(`/escrow/${id}/refund`),
};

// Documents
export const documentsAdminApi = {
  getAll: (p?: any) => adminApi.get("/documents", { params: p }),
  verify: (id: string) => adminApi.post(`/documents/${id}/verify`),
};

// Analytics
export const analyticsApi = {
  getOverview: () => adminApi.get("/analytics/overview"),
  getRevenue: (p?: any) => adminApi.get("/analytics/revenue", { params: p }),
  getUserGrowth: () => adminApi.get("/analytics/user-growth"),
  getListingsStats: () => adminApi.get("/analytics/listings"),
};

// Notifications
export const notificationsAdminApi = {
  send: (d: any) => adminApi.get("/notifications", { data: d }),
};

// Audit
export const auditApi = {
  getAll: (p?: any) => adminApi.get("/audit-logs", { params: p }),
};
