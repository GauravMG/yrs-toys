import type { AuthResponse, LoginInput, ChangePasswordInput, AuthUser, UpdateProfileInput } from "@yrs/shared";
import { apiFetch } from "../api-client";

export function login(input: LoginInput): Promise<AuthResponse> {
  return apiFetch<AuthResponse>("/auth/login", { method: "POST", body: input, skipAuth: true });
}

export function refresh(): Promise<AuthResponse> {
  return apiFetch<AuthResponse>("/auth/refresh", { method: "POST", skipAuth: true });
}

export function logout(): Promise<void> {
  return apiFetch<void>("/auth/logout", { method: "POST", skipAuth: true });
}

export function changePassword(input: ChangePasswordInput): Promise<void> {
  return apiFetch<void>("/auth/change-password", { method: "POST", body: input });
}

export function updateProfile(input: UpdateProfileInput): Promise<AuthUser> {
  return apiFetch<AuthUser>("/users/me", { method: "PATCH", body: input });
}
