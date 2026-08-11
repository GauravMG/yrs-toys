import { useMutation } from "@tanstack/react-query";
import type { AuthUser, UpdateProfileInput } from "@yrs/shared";
import { apiClient } from "../lib/api-client";
import { useAuthStore } from "../store/auth-store";

export function useUpdateProfile() {
  const setAuth = useAuthStore((s) => s.setAuth);
  const accessToken = useAuthStore((s) => s.accessToken);
  return useMutation({
    mutationFn: (input: UpdateProfileInput) => apiClient.patch<AuthUser>("/users/me", input),
    onSuccess: (user) => {
      if (accessToken) setAuth(user, accessToken);
    },
  });
}
