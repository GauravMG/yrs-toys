import type { FastifyInstance } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import { z } from "zod";
import { requireAdmin } from "../../middleware/require-admin.js";

export const adminDashboardStatsSchema = z.object({
  todayOrderCount: z.number().int(),
  todayRevenueInPaise: z.number().int(),
  pendingReviewCount: z.number().int(),
  lowStockProducts: z.array(
    z.object({ id: z.string(), name: z.string(), slug: z.string(), stock: z.number().int() }),
  ),
});
export type AdminDashboardStats = z.infer<typeof adminDashboardStatsSchema>;

export async function registerAdminDashboardRoutes(fastify: FastifyInstance) {
  const app = fastify.withTypeProvider<ZodTypeProvider>();
  const prisma = fastify.prisma;

  app.get(
    "/admin/dashboard/stats",
    { preHandler: requireAdmin, schema: { tags: ["admin-dashboard"], response: { 200: adminDashboardStatsSchema } } },
    async (): Promise<AdminDashboardStats> => {
      const startOfToday = new Date(new Date().setHours(0, 0, 0, 0));

      const [todayOrderCount, revenueAgg, pendingReviewCount, lowStockProducts] = await Promise.all([
        prisma.order.count({ where: { createdAt: { gte: startOfToday } } }),
        prisma.order.aggregate({
          _sum: { totalInPaise: true },
          where: { createdAt: { gte: startOfToday }, paymentStatus: "PAID" },
        }),
        prisma.review.count({ where: { status: "PENDING" } }),
        prisma.product.findMany({
          where: { isActive: true, stock: { lt: 5 } },
          orderBy: { stock: "asc" },
          take: 10,
          select: { id: true, name: true, slug: true, stock: true },
        }),
      ]);

      return {
        todayOrderCount,
        todayRevenueInPaise: revenueAgg._sum.totalInPaise ?? 0,
        pendingReviewCount,
        lowStockProducts,
      };
    },
  );
}
