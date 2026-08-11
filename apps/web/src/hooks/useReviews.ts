import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { Review, ReviewInput } from "@yrs/shared";
import { apiClient } from "../lib/api-client";
import { queryKeys } from "../lib/query-client";

export function useCreateReview(slug: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: ReviewInput) => apiClient.post<Review>(`/products/${slug}/reviews`, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products", "reviews", slug] });
      queryClient.invalidateQueries({ queryKey: queryKeys.products.detail(slug) });
    },
  });
}
