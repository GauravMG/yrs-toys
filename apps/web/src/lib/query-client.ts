import { QueryClient } from "@tanstack/react-query";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: 0,
    },
  },
});

/** Query key roots, kept in one place so invalidation call sites can't typo a key. */
export const queryKeys = {
  products: {
    all: ["products"] as const,
    list: (params: Record<string, unknown>) => ["products", "list", params] as const,
    detail: (slug: string) => ["products", "detail", slug] as const,
    related: (slug: string) => ["products", "related", slug] as const,
    reviews: (slug: string, page: number) => ["products", "reviews", slug, page] as const,
  },
  categories: {
    all: ["categories"] as const,
  },
  cart: {
    root: ["cart"] as const,
  },
  wishlist: {
    root: ["wishlist"] as const,
  },
  auth: {
    me: ["auth", "me"] as const,
  },
  orders: {
    list: (page: number) => ["orders", "list", page] as const,
    detail: (orderNumber: string) => ["orders", "detail", orderNumber] as const,
  },
  addresses: {
    all: ["addresses"] as const,
  },
};
