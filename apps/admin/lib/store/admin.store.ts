import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
interface AdminUser { id: string; email: string; role: "ADMIN"; profile?: { firstName: string; lastName: string; avatarUrl?: string }; }
interface AdminState {
  user: AdminUser | null; accessToken: string | null; refreshToken: string | null;
  loginSuccess: (u: AdminUser, a: string, r: string) => void;
  setTokens: (a: string, r: string) => void;
  logout: () => void;
}
export const useAdminStore = create<AdminState>()(
  persist(
    (set) => ({
      user: null, accessToken: null, refreshToken: null,
      loginSuccess: (user, accessToken, refreshToken) => set({ user, accessToken, refreshToken }),
      setTokens: (accessToken, refreshToken) => set({ accessToken, refreshToken }),
      logout: () => set({ user: null, accessToken: null, refreshToken: null }),
    }),
    { name: "kunda-admin-auth", storage: createJSONStorage(() => (typeof window !== "undefined" ? localStorage : { getItem:()=>null, setItem:()=>{}, removeItem:()=>{} })),
      partialize: (s) => ({ user: s.user, accessToken: s.accessToken, refreshToken: s.refreshToken }) }
  )
);
export const useAdminUser = () => useAdminStore((s) => s.user);
export const useIsLoggedIn = () => useAdminStore((s) => !!s.user && s.user.role === "ADMIN");
