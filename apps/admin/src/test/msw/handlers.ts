import { http, HttpResponse } from "msw";
import { API_BASE_URL } from "../../lib/api-client";
import { fixtureCategory, makeAdminReview, paginated } from "./fixtures";
import type { AdminReview } from "../../lib/api/reviews";

function initialReviews(): AdminReview[] {
  return [
    makeAdminReview({ id: "review_1", status: "PENDING" }),
    makeAdminReview({ id: "review_2", status: "PENDING", product: { id: "prod_2", name: "Plush Bear", slug: "plush-bear" } }),
  ];
}

let reviewsStore: AdminReview[] = initialReviews();

/** Called from test/setup.ts's afterEach so mutations (e.g. moderating a review) in one test never leak into the next. */
export function resetMockData() {
  reviewsStore = initialReviews();
}

export const handlers = [
  http.get(`${API_BASE_URL}/categories`, () => HttpResponse.json([fixtureCategory])),

  http.get(`${API_BASE_URL}/admin/reviews`, ({ request }) => {
    const url = new URL(request.url);
    const status = url.searchParams.get("status");
    const items = status ? reviewsStore.filter((r) => r.status === status) : reviewsStore;
    return HttpResponse.json(paginated(items));
  }),

  http.patch(`${API_BASE_URL}/admin/reviews/:id/moderate`, async ({ params, request }) => {
    const body = (await request.json()) as { status: "APPROVED" | "REJECTED" };
    const review = reviewsStore.find((r) => r.id === params.id);
    if (!review) return HttpResponse.json({ error: { code: "NOT_FOUND", message: "Not found" } }, { status: 404 });
    review.status = body.status;
    return HttpResponse.json(review);
  }),

  http.patch(`${API_BASE_URL}/admin/orders/:id/status`, async ({ request }) => {
    const body = (await request.json()) as { status: string; note?: string };
    return HttpResponse.json({ status: body.status });
  }),
];
