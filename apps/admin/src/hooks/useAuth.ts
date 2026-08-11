import { useMutation } from "@tanstack/react-query";
import { useAuthStore } from "../store/auth-store";
import * as authApi from "../lib/api/auth";
import { ApiError } from "../lib/api-client";
import type { LoginInput } from "@yrs/shared";

/** Rejects (and immediately signs back out) any login whose account isn't role ADMIN — this app is admin-only. */
export function useLogin() {
  const setAuth = useAuthStore((s) => s.setAuth);
  const clearAuth = useAuthStore((s) => s.clearAuth);

  return useMutation({
    mutationFn: async (input: LoginInput) => {
      const result = await authApi.login(input);
      if (result.user.role !== "ADMIN") {
        // The API authenticated a real account — but it's a customer, not
        // staff. Sign the cookie back out immediately rather than leaving a
        // half-authenticated CUSTOMER session sitting in this app.
        clearAuth();
        await authApi.logout().catch(() => undefined);
        throw new ApiError(403, "This account does not have admin access.", "NOT_ADMIN");
      }
      setAuth(result.user, result.accessToken);
      return result;
    },
  });
}

export function useLogout() {
  const clearAuth = useAuthStore((s) => s.clearAuth);
  return useMutation({
    mutationFn: () => authApi.logout(),
    onSettled: () => clearAuth(),
  });
}
