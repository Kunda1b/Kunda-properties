import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { MMKV } from "react-native-mmkv";
const storage = new MMKV({ id: "kunda-auth" });
const mmkvStorage = { getItem: (k: string) => storage.getString(k) ?? null, setItem: (k: string, v: string) => storage.set(k, v), removeItem: (k: string) => storage.delete(k) };

interface User { id: string; email: string; role: string; profile?: { firstName: string; lastName: string }; kyc?: { status: string }; }
interface AuthState {
  user: User | null; accessToken: string | null; refreshToken: string | null;
  loginSuccess: (u: User, a: string, r: string) => void; setTokens: (a: string, r: string) => void; logout: () => void;
}
export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null, accessToken: null, refreshToken: null,
      loginSuccess: (user, accessToken, refreshToken) => set({ user, accessToken, refreshToken }),
      setTokens: (accessToken, refreshToken) => set({ accessToken, refreshToken }),
      logout: () => set({ user: null, accessToken: null, refreshToken: null }),
    }),
    { name: "kunda-auth-mobile", storage: createJSONStorage(() => mmkvStorage) }
  )
);
