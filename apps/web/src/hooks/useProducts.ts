import { useQuery } from "@tanstack/react-query";
import type { Paginated, ProductDetail, ProductListQuery, ProductSummary, Review } from "@yrs/shared";
import { apiClient } from "../lib/api-client";
import { queryKeys } from "../lib/query-client";
import { toQueryString } from "../lib/query-string";

export function useProductList(query: Partial<ProductListQuery>) {
  return useQuery({
    queryKey: queryKeys.products.list(query),
    queryFn: () => apiClient.get<Paginated<ProductSummary>>(`/products${toQueryString(query)}`),
    placeholderData: (previousData) => previousData,
  });
}

export function useFeaturedProducts(limit = 8) {
  return useProductList({ isFeatured: true, limit });
}

export function useProductDetail(slug: string | undefined, options: { enabled?: boolean } = {}) {
  return useQuery({
    queryKey: queryKeys.products.detail(slug ?? ""),
    queryFn: () => apiClient.get<ProductDetail>(`/products/${slug}`),
    enabled: Boolean(slug) && (options.enabled ?? true),
    // Product data can change via the admin app at any time, so refetch on
    // every mount/focus of a detail page rather than trusting cached data.
    staleTime: 0,
    refetchOnMount: "always",
  });
}

export function useRelatedProducts(slug: string | undefined) {
  return useQuery({
    queryKey: queryKeys.products.related(slug ?? ""),
    queryFn: () => apiClient.get<ProductSummary[]>(`/products/${slug}/related`),
    enabled: Boolean(slug),
  });
}

export function useProductReviews(slug: string | undefined, page = 1, limit = 10) {
  return useQuery({
    queryKey: queryKeys.products.reviews(slug ?? "", page),
    queryFn: () => apiClient.get<Paginated<Review>>(`/products/${slug}/reviews${toQueryString({ page, limit })}`),
    enabled: Boolean(slug),
  });
}
