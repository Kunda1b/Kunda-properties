import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

interface AdminUser {
  id: string; email: string; role: string;
  profile?: { firstName?: string; lastName?: string };
}

interface AdminState {
  user: AdminUser | null;
  accessToken: string | null;
  loginSuccess: (user: AdminUser, accessToken: string) => void;
  logout: () => void;
}

export const useAdminStore = create<AdminState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      loginSuccess: (user, accessToken) => set({ user, accessToken }),
      logout: () => set({ user: null, accessToken: null }),
    }),
    {
      name: "kunda-admin-auth",
      storage: createJSONStorage(() =>
        typeof window !== "undefined" ? localStorage : { getItem: () => null, setItem: () => {}, removeItem: () => {} }
      ),
      partialize: (s) => ({ user: s.user, accessToken: s.accessToken }),
    }
  )
);
