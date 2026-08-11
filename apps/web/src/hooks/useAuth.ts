import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";
import type {
  AuthResponse,
  ChangePasswordInput,
  ForgotPasswordInput,
  LoginInput,
  RegisterInput,
  ResetPasswordInput,
} from "@yrs/shared";
import { apiClient } from "../lib/api-client";
import { queryKeys } from "../lib/query-client";
import { useAuthStore } from "../store/auth-store";
import { cartTokenStore } from "../store/cart-token-store";

/** Read-only view of the current auth state — convenience wrapper around the
 * Zustand store so components don't need to know it exists. */
export function useAuth() {
  const user = useAuthStore((s) => s.user);
  const isHydrating = useAuthStore((s) => s.isHydrating);
  return { user, isAuthenticated: Boolean(user), isHydrating };
}

/** Merges a guest cart into the now-authenticated user's cart, then forgets
 * the local guest token — called after both login and register succeed. */
function useMergeGuestCart() {
  const queryClient = useQueryClient();
  return useCallback(async () => {
    const guestToken = cartTokenStore.get();
    if (guestToken) {
      try {
        await apiClient.post("/cart/merge", { guestToken });
      } finally {
        cartTokenStore.clear();
      }
    }
    await queryClient.invalidateQueries({ queryKey: queryKeys.cart.root });
  }, [queryClient]);
}

export function useLogin() {
  const setAuth = useAuthStore((s) => s.setAuth);
  const mergeGuestCart = useMergeGuestCart();
  return useMutation({
    mutationFn: (input: LoginInput) => apiClient.post<AuthResponse>("/auth/login", input),
    onSuccess: async (data) => {
      setAuth(data.user, data.accessToken);
      await mergeGuestCart();
    },
  });
}

export function useRegister() {
  const setAuth = useAuthStore((s) => s.setAuth);
  const mergeGuestCart = useMergeGuestCart();
  return useMutation({
    mutationFn: (input: RegisterInput) => apiClient.post<AuthResponse>("/auth/register", input),
    onSuccess: async (data) => {
      setAuth(data.user, data.accessToken);
      await mergeGuestCart();
    },
  });
}

export function useLogout() {
  const clearAuth = useAuthStore((s) => s.clearAuth);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => apiClient.post<void>("/auth/logout"),
    onSettled: async () => {
      clearAuth();
      queryClient.clear();
    },
  });
}

export function useChangePassword() {
  return useMutation({
    mutationFn: (input: ChangePasswordInput) => apiClient.post<void>("/auth/change-password", input),
  });
}

export function useForgotPassword() {
  return useMutation({
    mutationFn: (input: ForgotPasswordInput) => apiClient.post<void>("/auth/forgot-password", input),
  });
}

export function useResetPassword() {
  return useMutation({
    mutationFn: (input: ResetPasswordInput) => apiClient.post<void>("/auth/reset-password", input),
  });
}
