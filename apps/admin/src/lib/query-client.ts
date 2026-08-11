import { QueryClient } from "@tanstack/react-query";

/**
 * Admins expect their own writes to show up immediately, and this app is
 * used by one or two staff at a time rather than thousands of concurrent
 * shoppers — so unlike a storefront, cache-friendliness matters far less
 * than always showing fresh data. Short/zero staleTime + refetch-on-focus
 * everywhere; mutations additionally invalidate their resource explicitly
 * (see hooks/*.ts) so a create/edit/delete is reflected right away.
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 0,
      gcTime: 5 * 60 * 1000,
      refetchOnWindowFocus: true,
      retry: 1,
    },
    mutations: {
      retry: 0,
    },
  },
});
