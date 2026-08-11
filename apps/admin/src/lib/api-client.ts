import { useAuthStore } from "../store/auth-store";
import { emitUnauthorized } from "./auth-events";

export const API_BASE_URL: string = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:4000/api/v1";

/** The API's origin without the `/api/v1` suffix — e.g. for building absolute `/uploads/*` image URLs. */
export const API_ORIGIN: string = API_BASE_URL.replace(/\/api\/v1\/?$/, "");

interface ApiErrorShape {
  error?: {
    code?: string;
    message?: string;
    issues?: unknown;
  };
}

export class ApiError extends Error {
  status: number;
  code?: string;
  issues?: unknown;

  constructor(status: number, message: string, code?: string, issues?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.issues = issues;
  }
}

export interface ApiFetchOptions extends Omit<RequestInit, "body"> {
  /** JSON-serializable body. Ignored if `form` is set. */
  body?: unknown;
  /** Pass a FormData body (multipart upload) verbatim — no JSON stringify,
   * no Content-Type header (the browser sets the multipart boundary). */
  form?: FormData;
  /** Skip attaching the Authorization header and skip the 401-refresh dance
   * entirely — used for the public auth endpoints themselves. */
  skipAuth?: boolean;
}

// Auth endpoints never trigger the refresh-and-retry flow: a 401 from
// /auth/login means "wrong password", not "expired session".
const AUTH_PATH_PREFIX = "/auth/";

let refreshInFlight: Promise<boolean> | null = null;

async function parseBody(res: Response): Promise<unknown> {
  const text = await res.text();
  if (!text) return undefined;
  try {
    return JSON.parse(text);
  } catch {
    return undefined;
  }
}

async function toApiError(res: Response): Promise<ApiError> {
  const data = (await parseBody(res)) as ApiErrorShape | undefined;
  return new ApiError(res.status, data?.error?.message ?? res.statusText, data?.error?.code, data?.error?.issues);
}

function buildInit(options: ApiFetchOptions, token: string | null): RequestInit {
  const headers = new Headers(options.headers);
  // Tells the API to set/read this app's refresh-token cookie under a name
  // distinct from apps/web's (see apps/api/src/modules/auth/routes.ts) —
  // without it, an admin and a customer session in the same browser would
  // silently sign each other out by overwriting a shared cookie.
  headers.set("X-Client-App", "admin");
  if (options.form) {
    // Let the browser set Content-Type (with multipart boundary) itself.
  } else if (options.body !== undefined) {
    headers.set("Content-Type", "application/json");
  }
  if (token && !options.skipAuth) {
    headers.set("Authorization", `Bearer ${token}`);
  }
  return {
    ...options,
    headers,
    credentials: "include",
    body: options.form ?? (options.body !== undefined ? JSON.stringify(options.body) : undefined),
  };
}

async function refreshAccessToken(): Promise<boolean> {
  if (!refreshInFlight) {
    refreshInFlight = (async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/auth/refresh`, {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
        });
        if (!res.ok) return false;
        const data = (await parseBody(res)) as { user?: { role?: string }; accessToken?: string } | undefined;
        if (!data?.accessToken || !data.user) return false;
        useAuthStore.getState().setAuth(data.user as never, data.accessToken);
        return true;
      } catch {
        return false;
      }
    })();
  }
  try {
    return await refreshInFlight;
  } finally {
    refreshInFlight = null;
  }
}

/**
 * Typed fetch wrapper used by every lib/api/*.ts module. Attaches the
 * in-memory access token, sends the refresh cookie along (`credentials:
 * "include"`), and on a 401 from an authenticated call tries
 * `POST /auth/refresh` exactly once before retrying — mirroring the same
 * pattern a normal SPA uses against this API. If the refresh also fails,
 * the stored session is cleared and an `unauthorized` event is emitted so
 * the app can redirect to /login.
 */
export async function apiFetch<T = unknown>(path: string, options: ApiFetchOptions = {}): Promise<T> {
  const isAuthPath = path.startsWith(AUTH_PATH_PREFIX);
  const token = useAuthStore.getState().accessToken;

  const res = await fetch(`${API_BASE_URL}${path}`, buildInit(options, token));

  if (res.status === 401 && !options.skipAuth && !isAuthPath) {
    const refreshed = await refreshAccessToken();
    if (refreshed) {
      const retryToken = useAuthStore.getState().accessToken;
      const retryRes = await fetch(`${API_BASE_URL}${path}`, buildInit(options, retryToken));
      if (!retryRes.ok) throw await toApiError(retryRes);
      if (retryRes.status === 204) return undefined as T;
      return (await parseBody(retryRes)) as T;
    }
    useAuthStore.getState().clearAuth();
    emitUnauthorized();
    throw new ApiError(401, "Your session has expired. Please log in again.", "UNAUTHORIZED");
  }

  if (!res.ok) throw await toApiError(res);
  if (res.status === 204) return undefined as T;
  return (await parseBody(res)) as T;
}
