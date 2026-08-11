const STORAGE_KEY = "yrs_guest_cart_token";

/**
 * Persists the guest cart token (issued by the API via the
 * `X-Guest-Cart-Token` response header) to localStorage so an anonymous
 * shopper's cart survives page reloads. Cleared once the guest logs in and
 * their cart is merged into their account (see hooks/useAuth.ts).
 */
export const cartTokenStore = {
  get(): string | null {
    try {
      return localStorage.getItem(STORAGE_KEY);
    } catch {
      return null;
    }
  },
  set(token: string): void {
    try {
      localStorage.setItem(STORAGE_KEY, token);
    } catch {
      // localStorage unavailable (private browsing, SSR, etc.) — no-op
    }
  },
  clear(): void {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // no-op
    }
  },
};
