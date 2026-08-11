import { useAuthStore } from "../store/auth-store";
import { cartTokenStore } from "../store/cart-token-store";
import { authHydrated } from "./auth-bootstrap";
import type { AuthResponse } from "@yrs/shared";

export const API_BASE_URL: string = import.meta.env.VITE_API_BASE_URL || "http://localhost:4000/api/v1";

const GUEST_TOKEN_REQUEST_HEADER = "X-Guest-Cart-Token";
const GUEST_TOKEN_RESPONSE_HEADER = "x-guest-cart-token";

/** Auth endpoints that must never trigger a refresh-and-retry on 401 — doing
 * so would either be redundant (refresh itself) or mask a genuine bad
 * credentials / bad token error as something retryable. */
const NO_REFRESH_PATHS = ["/auth/login", "/auth/register", "/auth/refresh"];

export interface ApiErrorBody {
  error: {
    code: string;
    message: string;
    issues?: unknown;
  };
}

export class ApiError extends Error {
  status: number;
  code: string;
  issues?: unknown;

  constructor(status: number, body: ApiErrorBody | null) {
    super(body?.error?.message ?? `Request failed with status ${status}`);
    this.name = "ApiError";
    this.status = status;
    this.code = body?.error?.code ?? "UNKNOWN_ERROR";
    this.issues = body?.error?.issues;
  }
}

export interface RequestOptions extends Omit<RequestInit, "body"> {
  body?: unknown;
  /** Skip the Authorization header even if a token is present (unused today, kept for completeness). */
  skipAuth?: boolean;
}

function isNoRefreshPath(path: string): boolean {
  return NO_REFRESH_PATHS.some((p) => path.startsWith(p));
}

function buildHeaders(options: RequestOptions): Headers {
  const headers = new Headers(options.headers);

  if (options.body !== undefined && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  if (!options.skipAuth) {
    const token = useAuthStore.getState().accessToken;
    if (token) headers.set("Authorization", `Bearer ${token}`);
  }

  const guestToken = cartTokenStore.get();
  if (guestToken) headers.set(GUEST_TOKEN_REQUEST_HEADER, guestToken);

  return headers;
}

function persistGuestTokenFrom(response: Response): void {
  const issued = response.headers.get(GUEST_TOKEN_RESPONSE_HEADER);
  if (issued) cartTokenStore.set(issued);
}

async function parseBody<T>(response: Response): Promise<T> {
  if (response.status === 204) return undefined as T;
  const text = await response.text();
  if (!text) return undefined as T;
  return JSON.parse(text) as T;
}

async function doFetch(path: string, options: RequestOptions): Promise<Response> {
  return fetch(`${API_BASE_URL}${path}`, {
    ...options,
    credentials: "include",
    headers: buildHeaders(options),
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
  });
}

let refreshPromise: Promise<boolean> | null = null;

/** Calls `/auth/refresh` at most once concurrently; all callers share the
 * same in-flight promise so a burst of parallel 401s doesn't fire a burst
 * of refresh calls. */
async function refreshAccessToken(): Promise<boolean> {
  if (!refreshPromise) {
    refreshPromise = (async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
          method: "POST",
          credentials: "include",
        });
        if (!response.ok) return false;
        const data = (await response.json()) as AuthResponse;
        useAuthStore.getState().setAuth(data.user, data.accessToken);
        return true;
      } catch {
        return false;
      } finally {
        refreshPromise = null;
      }
    })();
  }
  return refreshPromise;
}

/**
 * Typed fetch wrapper for the YRS Toys API. Attaches the bearer token and
 * guest cart token, round-trips the httpOnly refresh cookie, and
 * transparently retries a request once after a successful silent refresh.
 *
 * Every request except the boot-time `/auth/refresh` call itself (which
 * would otherwise deadlock waiting on its own result) first awaits
 * `authHydrated`, so nothing can race ahead of the silent session-restore
 * and get misattributed to "guest" on a hard page load — see
 * lib/auth-bootstrap.ts for the full explanation.
 */
export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  if (!isNoRefreshPath(path)) await authHydrated;

  let response = await doFetch(path, options);
  persistGuestTokenFrom(response);

  if (response.status === 401 && !isNoRefreshPath(path)) {
    const refreshed = await refreshAccessToken();
    if (refreshed) {
      response = await doFetch(path, options);
      persistGuestTokenFrom(response);
    } else {
      useAuthStore.getState().clearAuth();
    }
  }

  if (!response.ok) {
    let body: ApiErrorBody | null = null;
    try {
      body = (await response.json()) as ApiErrorBody;
    } catch {
      // non-JSON error body — leave `body` null, ApiError falls back to a generic message
    }
    throw new ApiError(response.status, body);
  }

  return parseBody<T>(response);
}

export const apiClient = {
  get: <T>(path: string, options?: RequestOptions) => apiRequest<T>(path, { ...options, method: "GET" }),
  post: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    apiRequest<T>(path, { ...options, method: "POST", body }),
  patch: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    apiRequest<T>(path, { ...options, method: "PATCH", body }),
  delete: <T>(path: string, options?: RequestOptions) => apiRequest<T>(path, { ...options, method: "DELETE" }),
};
