import { create } from "zustand";
import type { AuthUser } from "@yrs/shared";

interface AuthState {
  user: AuthUser | null;
  /** In-memory only — never persisted to localStorage/sessionStorage. The
   * long-lived session lives in the httpOnly refresh cookie the API sets;
   * losing this on a hard refresh is expected, and App.tsx re-derives it
   * via POST /auth/refresh on boot (see hooks/useBootstrapAuth.ts). */
  accessToken: string | null;
  /** True once the initial boot-time refresh attempt has resolved (success
   * or failure) — lets the route guard avoid a flash-redirect to /login
   * while that check is still in flight. */
  isHydrated: boolean;
  setAuth: (user: AuthUser, accessToken: string) => void;
  clearAuth: () => void;
  setHydrated: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  accessToken: null,
  isHydrated: false,
  setAuth: (user, accessToken) => set({ user, accessToken }),
  clearAuth: () => set({ user: null, accessToken: null }),
  setHydrated: () => set({ isHydrated: true }),
}));

export function isAdminSession(state: Pick<AuthState, "user" | "accessToken">): boolean {
  return Boolean(state.user && state.accessToken && state.user.role === "ADMIN");
}
