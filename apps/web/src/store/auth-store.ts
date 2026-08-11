import { create } from "zustand";
import type { AuthUser } from "@yrs/shared";

interface AuthState {
  user: AuthUser | null;
  accessToken: string | null;
  /** True until the initial `/auth/refresh` boot check has resolved. */
  isHydrating: boolean;
  setAuth: (user: AuthUser, accessToken: string) => void;
  clearAuth: () => void;
  setHydrating: (value: boolean) => void;
}

// Access token intentionally lives in memory only — never localStorage — so
// an XSS payload can't read it off disk. Session survival across reloads is
// handled by the httpOnly refresh cookie + a one-time `/auth/refresh` call
// on app boot (see main.tsx / hooks/useAuth.ts).
export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  accessToken: null,
  isHydrating: true,
  setAuth: (user, accessToken) => set({ user, accessToken }),
  clearAuth: () => set({ user: null, accessToken: null }),
  setHydrating: (value) => set({ isHydrating: value }),
}));
