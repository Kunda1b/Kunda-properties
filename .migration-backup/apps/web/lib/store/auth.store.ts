import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

interface UserProfile { firstName: string; lastName: string; avatarUrl?: string; }
interface User {
  id: string; email: string; role: "BUYER"|"SELLER"|"AGENT"|"ADMIN";
  isEmailVerified: boolean; diasporaCountry?: string; preferredCurrency: string;
  profile?: UserProfile; kyc?: { status: string };
}
interface AuthState {
  user: User | null; accessToken: string | null; refreshToken: string | null; isLoading: boolean;
  setUser: (u: User) => void;
  setTokens: (a: string, r: string) => void;
  loginSuccess: (u: User, a: string, r: string) => void;
  logout: () => void;
  setLoading: (l: boolean) => void;
  updateUser: (u: Partial<User>) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null, accessToken: null, refreshToken: null, isLoading: false,
      setUser: (user) => set({ user }),
      setTokens: (accessToken, refreshToken) => set({ accessToken, refreshToken }),
      loginSuccess: (user, accessToken, refreshToken) => set({ user, accessToken, refreshToken, isLoading: false }),
      logout: () => set({ user: null, accessToken: null, refreshToken: null }),
      setLoading: (isLoading) => set({ isLoading }),
      updateUser: (updates) => { const cur = get().user; if (cur) set({ user: { ...cur, ...updates } }); },
    }),
    {
      name: "kunda-auth",
      storage: createJSONStorage(() => (typeof window !== "undefined" ? localStorage : { getItem: () => null, setItem: () => {}, removeItem: () => {} })),
      partialize: (s) => ({ user: s.user, accessToken: s.accessToken, refreshToken: s.refreshToken }),
    }
  )
);
export const useUser = () => useAuthStore((s) => s.user);
