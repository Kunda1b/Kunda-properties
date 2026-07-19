import axios, { AxiosError, AxiosRequestConfig } from "axios";
import { useAuthStore } from "@/lib/store/auth.store";

// In the Replit proxy environment, /api routes to the api-server artifact.
// For external API, set VITE_API_URL env var.
const BASE_URL = import.meta.env.VITE_API_URL || "";

export const api = axios.create({
  baseURL: `${BASE_URL}/api`,
  timeout: 30000,
  headers: { "Content-Type": "application/json" },
});

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

let isRefreshing = false;
let failedQueue: Array<{ resolve: (v: any) => void; reject: (e: any) => void }> = [];
function processQueue(error: Error | null, token?: string) {
  failedQueue.forEach((p) => (error ? p.reject(error) : p.resolve(token)));
  failedQueue = [];
}

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as AxiosRequestConfig & { _retry?: boolean };
    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => { failedQueue.push({ resolve, reject }); }).then((token) => {
          originalRequest.headers = { ...originalRequest.headers, Authorization: `Bearer ${token}` };
          return api(originalRequest);
        });
      }
      originalRequest._retry = true;
      isRefreshing = true;
      try {
        const { refreshToken, setTokens } = useAuthStore.getState();
        if (!refreshToken) throw new Error("No refresh token");
        const { data } = await api.post("/auth/refresh", { refreshToken });
        const newAccessToken = data.data.accessToken;
        setTokens(newAccessToken, data.data.refreshToken);
        processQueue(null, newAccessToken);
        isRefreshing = false;
        originalRequest.headers = { ...originalRequest.headers, Authorization: `Bearer ${newAccessToken}` };
        return api(originalRequest);
      } catch (err) {
        processQueue(err as Error);
        isRefreshing = false;
        useAuthStore.getState().logout();
        // Navigate only after all queued requests have been rejected
        if (typeof window !== "undefined") window.location.replace("/auth/login");
        return Promise.reject(err);
      }
    }
    return Promise.reject(error);
  }
);

export const authApi = {
  register: (d: any) => api.post("/auth/register", d),
  login: (d: any) => api.post("/auth/login", d),
  logout: () => api.post("/auth/logout"),
  getMe: () => api.get("/auth/me"),
  verifyEmail: (t: string) => api.get(`/auth/verify-email/${t}`),
  forgotPassword: (e: string) => api.post("/auth/forgot-password", { email: e }),
  resetPassword: (d: any) => api.post("/auth/reset-password", d),
};

export const listingsApi = {
  search: (p: any) => api.get("/search", { params: p }),
  featured: () => api.get("/search/featured"),
  stats: () => api.get("/search/stats"),
  getOne: (id: string) => api.get(`/listings/${id}`),
  getSimilar: (id: string) => api.get(`/search/${id}/similar`),
  create: (d: any) => api.post("/listings", d),
  update: (id: string, d: any) => api.patch(`/listings/${id}`, d),
  submit: (id: string) => api.post(`/listings/${id}/submit-review`),
  delete: (id: string) => api.delete(`/listings/${id}`),
  getMine: (p?: any) => api.get("/listings/my/all", { params: p }),
  uploadImages: (id: string, image: any) => api.post(`/listings/${id}/images`, image),
};

export const escrowApi = {
  initiate: (d: any) => api.post("/escrow", d),
  getOne: (id: string) => api.get(`/escrow/${id}`),
  getMine: (p?: any) => api.get("/escrow/my", { params: p }),
  createPayment: (id: string) => api.post(`/escrow/${id}/payment-intent`),
  approve: (id: string, notes?: string) => api.post(`/escrow/${id}/approve-release`, { notes }),
  dispute: (id: string, reason: string) => api.post(`/escrow/${id}/dispute`, { reason }),
};

export const offersApi = {
  make: (d: any) => api.post("/offers", d),
  respond: (id: string, d: any) => api.patch(`/offers/${id}/respond`, d),
  getMine: (p?: any) => api.get("/offers/my", { params: p }),
};

export const kycApi = {
  getStatus: () => api.get("/kyc/status"),
  submit: (d: any) => api.post("/kyc/submit", d),
  uploadDoc: (d: any) => api.post("/kyc/upload-document", d),
};

export const notificationsApi = {
  getAll: (p?: any) => api.get("/notifications", { params: p }),
  markRead: (ids: string[] | "all") => api.patch("/notifications/read", { ids }),
};

export const savedApi = {
  getAll: () => api.get("/saved"),
  save: (id: string) => api.post(`/saved/${id}`),
  unsave: (id: string) => api.delete(`/saved/${id}`),
};

export const documentsApi = {
  getAll: (p?: any) => api.get("/documents", { params: p }),
  upload: (d: any) => api.post("/documents", d),
  getUrl: (id: string) => api.get(`/documents/${id}/url`),
  delete: (id: string) => api.delete(`/documents/${id}`),
};

export const messagesApi = {
  getConversations: () => api.get("/messages/conversations"),
  getConversation: (id: string) => api.get(`/messages/conversations/${id}`),
  start: (d: any) => api.post("/messages/start", d),
  reply: (convId: string, message: string) => api.post(`/messages/conversations/${convId}`, { message }),
  unreadCount: () => api.get("/messages/unread-count"),
};

export const viewingsApi = {
  getAll: () => api.get("/viewings"),
  request: (d: any) => api.post("/viewings", d),
  respond: (id: string, d: any) => api.patch(`/viewings/${id}/respond`, d),
};

export const agentsApi = {
  getAll: () => api.get("/agents"),
  getOne: (id: string) => api.get(`/agents/${id}`),
};

export const ratesApi = {
  getAll: () => api.get("/admin/exchange-rates"),
};

export const neighbourhoodsApi = {
  getAll: (region?: string) => api.get("/neighbourhoods", { params: { region } }),
  getOne: (area: string) => api.get(`/neighbourhoods/${area}`),
};
