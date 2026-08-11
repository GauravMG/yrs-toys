import type { PrismaClient } from "@yrs/db";
import type { WishlistItem } from "@yrs/shared";
import { NotFoundError } from "../../lib/http-errors.js";
import { productSummaryInclude, toProductSummary } from "../../lib/product-mapper.js";

export function wishlistService(prisma: PrismaClient) {
  return {
    async list(userId: string): Promise<WishlistItem[]> {
      const items = await prisma.wishlistItem.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        include: { product: { include: productSummaryInclude } },
      });
      return items.map((item) => ({
        id: item.id,
        productId: item.productId,
        createdAt: item.createdAt.toISOString(),
        product: toProductSummary(item.product),
      }));
    },

    async add(userId: string, productId: string): Promise<WishlistItem> {
      const product = await prisma.product.findUnique({
        where: { id: productId },
        include: productSummaryInclude,
      });
      if (!product) throw new NotFoundError("Product not found");

      const item = await prisma.wishlistItem.upsert({
        where: { userId_productId: { userId, productId } },
        create: { userId, productId },
        update: {},
      });

      return {
        id: item.id,
        productId: item.productId,
        createdAt: item.createdAt.toISOString(),
        product: toProductSummary(product),
      };
    },

    async remove(userId: string, productId: string): Promise<void> {
      await prisma.wishlistItem.deleteMany({ where: { userId, productId } });
    },
  };
}
export type WishlistService = ReturnType<typeof wishlistService>;
