/**
 * Tiny pub/sub so lib/api-client.ts (which has no React Router context) can
 * tell the app "the session just died, send the admin to /login" without
 * doing a hard `window.location` reload. A top-level listener mounted
 * inside <BrowserRouter> (see components/SessionListener.tsx) subscribes to
 * this and performs the actual client-side navigation.
 */
type Listener = () => void;

const listeners = new Set<Listener>();

export function onUnauthorized(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function emitUnauthorized(): void {
  for (const listener of listeners) listener();
}
