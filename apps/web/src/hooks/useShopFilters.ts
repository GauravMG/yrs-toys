import { useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import type { AgeGroupValue, ProductSort } from "@yrs/shared";

export interface ShopFilters {
  categorySlug?: string;
  ageGroup?: AgeGroupValue;
  minPrice?: number;
  maxPrice?: number;
  q?: string;
  sort: ProductSort;
  page: number;
  limit: number;
}

const DEFAULT_LIMIT = 12;

/**
 * Reads/writes the shop catalog's filter state from the URL's search params
 * so filters are shareable and the browser back button works — the API's
 * own `productListQuerySchema` field names are used as the param keys 1:1.
 */
export function useShopFilters() {
  const [searchParams, setSearchParams] = useSearchParams();

  const filters: ShopFilters = useMemo(() => {
    const minPrice = searchParams.get("minPrice");
    const maxPrice = searchParams.get("maxPrice");
    const page = searchParams.get("page");
    const limit = searchParams.get("limit");
    return {
      categorySlug: searchParams.get("categorySlug") ?? undefined,
      ageGroup: (searchParams.get("ageGroup") as AgeGroupValue | null) ?? undefined,
      minPrice: minPrice ? Number(minPrice) : undefined,
      maxPrice: maxPrice ? Number(maxPrice) : undefined,
      q: searchParams.get("q") ?? undefined,
      sort: (searchParams.get("sort") as ProductSort | null) ?? "newest",
      page: page ? Number(page) : 1,
      limit: limit ? Number(limit) : DEFAULT_LIMIT,
    };
  }, [searchParams]);

  function updateFilters(patch: Partial<ShopFilters>, options: { resetPage?: boolean } = { resetPage: true }) {
    const next = new URLSearchParams(searchParams);
    const merged = { ...filters, ...patch, ...(options.resetPage ? { page: 1 } : {}) };

    for (const [key, value] of Object.entries(merged)) {
      if (value === undefined || value === null || value === "" || (key === "sort" && value === "newest") || (key === "page" && value === 1) || (key === "limit" && value === DEFAULT_LIMIT)) {
        next.delete(key);
      } else {
        next.set(key, String(value));
      }
    }
    setSearchParams(next, { replace: false });
  }

  function setPage(page: number) {
    updateFilters({ page }, { resetPage: false });
  }

  function clearFilters() {
    setSearchParams(new URLSearchParams());
  }

  return { filters, updateFilters, setPage, clearFilters };
}
