/**
 * Resolves once the one-shot boot-time `/auth/refresh` (see
 * hooks/useAuthBootstrap.ts) has settled, whichever way. Every API request
 * except the bootstrap's own `/auth/refresh` call awaits this before firing
 * (see lib/api-client.ts) — without it, a request that depends on knowing
 * the visitor's identity (e.g. `GET /cart`, which returns a different cart
 * for a guest vs. a signed-in user) can win the race against the silent
 * session restore on a hard page load, permanently misattributing that
 * request to "guest" even though the visitor turns out to be signed in a
 * moment later.
 */
let resolveHydrated: (() => void) | null = null;

export const authHydrated: Promise<void> = new Promise((resolve) => {
  resolveHydrated = resolve;
});

export function markAuthHydrated(): void {
  resolveHydrated?.();
  resolveHydrated = null;
}
