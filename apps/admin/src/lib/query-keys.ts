/** Central query-key registry so invalidation after mutations stays in sync with list/detail reads. */
export const queryKeys = {
  dashboardStats: ["dashboard", "stats"] as const,

  products: (query?: unknown) => ["products", "list", query] as const,
  productsAll: ["products", "list"] as const,
  product: (id: string) => ["products", "detail", id] as const,

  categories: ["categories", "list"] as const,
  category: (id: string) => ["categories", "detail", id] as const,

  orders: (query?: unknown) => ["orders", "list", query] as const,
  ordersAll: ["orders", "list"] as const,
  order: (id: string) => ["orders", "detail", id] as const,

  coupons: ["coupons", "list"] as const,
  coupon: (id: string) => ["coupons", "detail", id] as const,

  reviews: (query?: unknown) => ["reviews", "list", query] as const,
  reviewsAll: ["reviews", "list"] as const,
};
