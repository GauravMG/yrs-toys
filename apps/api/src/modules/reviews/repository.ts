import type { PrismaClient, ReviewStatus } from "@yrs/db";
import { paginationSkip } from "../../lib/pagination.js";

const withAuthor = { user: { select: { id: true, fullName: true } } } as const;

export function reviewRepository(prisma: PrismaClient) {
  return {
    findProductBySlug(slug: string) {
      return prisma.product.findUnique({ where: { slug } });
    },

    findById(id: string) {
      return prisma.review.findUnique({ where: { id }, include: withAuthor });
    },

    async findManyForProduct(productId: string, status: ReviewStatus, page: number, limit: number) {
      const where = { productId, status };
      const [total, rows] = await Promise.all([
        prisma.review.count({ where }),
        prisma.review.findMany({
          where,
          include: withAuthor,
          orderBy: { createdAt: "desc" },
          skip: paginationSkip(page, limit),
          take: limit,
        }),
      ]);
      return { rows, total };
    },

    async findManyForAdmin(status: ReviewStatus | undefined, page: number, limit: number) {
      const where = status ? { status } : {};
      const [total, rows] = await Promise.all([
        prisma.review.count({ where }),
        prisma.review.findMany({
          where,
          include: { ...withAuthor, product: { select: { id: true, name: true, slug: true } } },
          orderBy: { createdAt: "asc" },
          skip: paginationSkip(page, limit),
          take: limit,
        }),
      ]);
      return { rows, total };
    },

    findExisting(productId: string, userId: string) {
      return prisma.review.findUnique({ where: { productId_userId: { productId, userId } } });
    },

    async hasDeliveredOrderFor(userId: string, productId: string): Promise<boolean> {
      const count = await prisma.orderItem.count({
        where: {
          productId,
          order: { userId, status: "DELIVERED" },
        },
      });
      return count > 0;
    },

    create(data: { productId: string; userId: string; rating: number; title?: string; comment: string; isVerifiedPurchase: boolean }) {
      return prisma.review.create({ data, include: withAuthor });
    },

    update(id: string, data: { rating?: number; title?: string; comment?: string; status?: ReviewStatus }) {
      return prisma.review.update({ where: { id }, data, include: withAuthor });
    },

    delete(id: string) {
      return prisma.review.delete({ where: { id } });
    },

    async recomputeProductRating(productId: string) {
      const agg = await prisma.review.aggregate({
        where: { productId, status: "APPROVED" },
        _avg: { rating: true },
        _count: { rating: true },
      });
      await prisma.product.update({
        where: { id: productId },
        data: { avgRating: agg._avg.rating ?? 0, reviewCount: agg._count.rating },
      });
    },
  };
}
export type ReviewRepository = ReturnType<typeof reviewRepository>;
