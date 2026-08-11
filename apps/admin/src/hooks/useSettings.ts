import { useMutation } from "@tanstack/react-query";
import type { ChangePasswordInput, UpdateProfileInput } from "@yrs/shared";
import * as authApi from "../lib/api/auth";
import { useAuthStore } from "../store/auth-store";

export function useUpdateProfile() {
  const user = useAuthStore((s) => s.user);
  const accessToken = useAuthStore((s) => s.accessToken);
  const setAuth = useAuthStore((s) => s.setAuth);
  return useMutation({
    mutationFn: (input: UpdateProfileInput) => authApi.updateProfile(input),
    onSuccess: (updated) => {
      if (accessToken) setAuth({ ...user, ...updated }, accessToken);
    },
  });
}

export function useChangePassword() {
  return useMutation({
    mutationFn: (input: ChangePasswordInput) => authApi.changePassword(input),
  });
}
