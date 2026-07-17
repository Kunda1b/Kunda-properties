import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

interface UserProfile { firstName?: string; lastName?: string; avatarUrl?: string; }
interface UserKyc { status: "PENDING" | "SUBMITTED" | "VERIFIED" | "REJECTED"; }
interface User {
  id: string; email: string; role: string;
  profile?: UserProfile; kyc?: UserKyc;
}

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isLoading: boolean;
  setUser: (user: User) => void;
  setTokens: (accessToken: string, refreshToken: string) => void;
  loginSuccess: (user: User, accessToken: string, refreshToken: string) => void;
  logout: () => void;
  setLoading: (isLoading: boolean) => void;
  updateUser: (updates: Partial<User>) => void;
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
      updateUser: (updates) => {
        const cur = get().user;
        if (cur) set({ user: { ...cur, ...updates } });
      },
    }),
    {
      name: "kunda-auth",
      storage: createJSONStorage(() =>
        typeof window !== "undefined" ? localStorage : { getItem: () => null, setItem: () => {}, removeItem: () => {} }
      ),
      partialize: (s) => ({ user: s.user, accessToken: s.accessToken, refreshToken: s.refreshToken }),
    }
  )
);

export const useUser = () => useAuthStore((s) => s.user);
