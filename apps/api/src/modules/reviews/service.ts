import type { PrismaClient } from "@yrs/db";
import type { Review, ReviewInput, Paginated } from "@yrs/shared";
import type { ReviewStatusValue } from "@yrs/shared";
import { reviewRepository } from "./repository.js";
import { buildPaginated } from "../../lib/pagination.js";
import { NotFoundError, ForbiddenError } from "../../lib/http-errors.js";

function toReview(row: {
  id: string;
  productId: string;
  user: { id: string; fullName: string };
  rating: number;
  title: string | null;
  comment: string;
  isVerifiedPurchase: boolean;
  status: ReviewStatusValue;
  createdAt: Date;
  updatedAt: Date;
}): Review {
  return {
    id: row.id,
    productId: row.productId,
    user: row.user,
    rating: row.rating,
    title: row.title,
    comment: row.comment,
    isVerifiedPurchase: row.isVerifiedPurchase,
    status: row.status,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export function reviewService(prisma: PrismaClient) {
  const repo = reviewRepository(prisma);

  return {
    async listForProduct(slug: string, page: number, limit: number): Promise<Paginated<Review>> {
      const product = await repo.findProductBySlug(slug);
      if (!product) throw new NotFoundError("Product not found");
      const { rows, total } = await repo.findManyForProduct(product.id, "APPROVED", page, limit);
      return buildPaginated(rows.map(toReview), total, page, limit);
    },

    async listForAdmin(status: ReviewStatusValue | undefined, page: number, limit: number) {
      const { rows, total } = await repo.findManyForAdmin(status, page, limit);
      return buildPaginated(
        rows.map((r) => ({ ...toReview(r), product: r.product })),
        total,
        page,
        limit,
      );
    },

    async create(slug: string, userId: string, input: ReviewInput): Promise<Review> {
      const product = await repo.findProductBySlug(slug);
      if (!product) throw new NotFoundError("Product not found");

      const isVerifiedPurchase = await repo.hasDeliveredOrderFor(userId, product.id);
      const created = await repo.create({
        productId: product.id,
        userId,
        rating: input.rating,
        title: input.title,
        comment: input.comment,
        isVerifiedPurchase,
      });
      return toReview(created);
    },

    async update(reviewId: string, userId: string, input: Partial<ReviewInput>): Promise<Review> {
      const existing = await repo.findById(reviewId);
      if (!existing) throw new NotFoundError("Review not found");
      if (existing.userId !== userId) throw new ForbiddenError();

      // Editing a review pulls it back out of the public feed until an
      // admin re-approves the new content.
      const updated = await repo.update(reviewId, { ...input, status: "PENDING" });
      await repo.recomputeProductRating(existing.productId);
      return toReview(updated);
    },

    async remove(reviewId: string, requester: { id: string; role: "CUSTOMER" | "ADMIN" }): Promise<void> {
      const existing = await repo.findById(reviewId);
      if (!existing) throw new NotFoundError("Review not found");
      if (existing.userId !== requester.id && requester.role !== "ADMIN") throw new ForbiddenError();

      await repo.delete(reviewId);
      await repo.recomputeProductRating(existing.productId);
    },

    async moderate(reviewId: string, status: "APPROVED" | "REJECTED"): Promise<Review> {
      const existing = await repo.findById(reviewId);
      if (!existing) throw new NotFoundError("Review not found");

      const updated = await repo.update(reviewId, { status });
      await repo.recomputeProductRating(existing.productId);
      return toReview(updated);
    },
  };
}
export type ReviewService = ReturnType<typeof reviewService>;
