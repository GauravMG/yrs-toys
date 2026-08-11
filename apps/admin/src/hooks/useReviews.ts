import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { ModerateReviewInput } from "@yrs/shared";
import * as reviewsApi from "../lib/api/reviews";
import type { AdminReviewQuery } from "../lib/api/reviews";
import { queryKeys } from "../lib/query-keys";

export function useAdminReviews(query: AdminReviewQuery) {
  return useQuery({
    queryKey: queryKeys.reviews(query),
    queryFn: () => reviewsApi.listAdminReviews(query),
    placeholderData: (prev) => prev,
  });
}

export function useModerateReview() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: ModerateReviewInput }) => reviewsApi.moderateReview(id, input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.reviewsAll });
    },
  });
}
