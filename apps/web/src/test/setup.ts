import "@testing-library/jest-dom/vitest";
import { afterAll, afterEach, beforeAll } from "vitest";
import { server } from "./msw/server";
import { resetMockServerState } from "./msw/handlers";
import { useAuthStore } from "../store/auth-store";
import { useUiStore } from "../store/ui-store";
import { markAuthHydrated } from "../lib/auth-bootstrap";

beforeAll(() => {
  server.listen({ onUnhandledRequest: "error" });
  // jsdom doesn't implement layout/scrolling — ShopPage scrolls to top on
  // pagination, which would otherwise log a noisy "not implemented" error.
  window.scrollTo = () => {};
  // Component tests render pages directly, without the App boot sequence
  // (hooks/useAuthBootstrap.ts) that normally resolves this — without
  // calling it here, every apiRequest() in lib/api-client.ts would hang
  // forever awaiting a promise nothing ever settles.
  markAuthHydrated();
});

afterEach(() => {
  server.resetHandlers();
  resetMockServerState();
  useAuthStore.setState({ user: null, accessToken: null, isHydrating: false });
  useUiStore.setState({ isCartDrawerOpen: false });
  localStorage.clear();
});

afterAll(() => server.close());
