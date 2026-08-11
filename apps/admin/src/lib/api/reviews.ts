import type { Paginated, Review, ReviewStatusValue, ModerateReviewInput } from "@yrs/shared";
import { apiFetch } from "../api-client";
import { toQueryString } from "../query-string";

/**
 * `GET /admin/reviews` returns `reviewSchema` extended with a `product`
 * summary (see apps/api/src/modules/reviews/routes.ts `adminReviewSchema`)
 * — that shape isn't exported from @yrs/shared, so it's mirrored here.
 */
export interface AdminReview extends Review {
  product: { id: string; name: string; slug: string };
}

export type AdminReviewQuery = {
  status?: ReviewStatusValue;
  page?: number;
  limit?: number;
};

export function listAdminReviews(query: AdminReviewQuery = {}): Promise<Paginated<AdminReview>> {
  return apiFetch<Paginated<AdminReview>>(`/admin/reviews${toQueryString(query)}`);
}

export function moderateReview(id: string, input: ModerateReviewInput): Promise<Review> {
  return apiFetch<Review>(`/admin/reviews/${id}/moderate`, { method: "PATCH", body: input });
}
