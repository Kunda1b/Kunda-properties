import axios from "axios";
import { useAuthStore } from "../store/auth.store";
const BASE_URL = process.env.EXPO_PUBLIC_API_URL || "http://localhost:4000";
export const api = axios.create({ baseURL: `${BASE_URL}/api`, timeout: 30000 });
api.interceptors.request.use((config) => { const t = useAuthStore.getState().accessToken; if (t) config.headers.Authorization = `Bearer ${t}`; return config; });

export const authApi = { login: (d: any) => api.post("/auth/login", d), register: (d: any) => api.post("/auth/register", d) };
export const listingsApi = { search: (p: any) => api.get("/search", { params: p }), featured: () => api.get("/search/featured"), getOne: (id: string) => api.get(`/listings/${id}`) };
export const escrowApi = { getMine: (p?: any) => api.get("/escrow/my", { params: p }), initiate: (d: any) => api.post("/escrow", d), approve: (id: string, notes?: string) => api.post(`/escrow/${id}/approve-release`, { notes }) };
export const offersApi = { make: (d: any) => api.post("/offers", d) };
export const savedApi = { getAll: () => api.get("/saved"), save: (id: string) => api.post(`/saved/${id}`), unsave: (id: string) => api.delete(`/saved/${id}`) };
