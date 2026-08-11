import { useQuery } from "@tanstack/react-query";
import type { Category } from "@yrs/shared";
import { apiClient } from "../lib/api-client";
import { queryKeys } from "../lib/query-client";

export function useCategories() {
  return useQuery({
    queryKey: queryKeys.categories.all,
    queryFn: () => apiClient.get<Category[]>("/categories"),
    staleTime: 5 * 60_000,
  });
}
