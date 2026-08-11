import type { PrismaClient, Prisma } from "@yrs/db";
import type { ProductListQuery } from "@yrs/shared";
import { productSummaryInclude, productDetailInclude } from "../../lib/product-mapper.js";
import { paginationSkip } from "../../lib/pagination.js";

const SORT_MAP: Record<ProductListQuery["sort"], Prisma.ProductOrderByWithRelationInput> = {
  newest: { createdAt: "desc" },
  price_asc: { priceInPaise: "asc" },
  price_desc: { priceInPaise: "desc" },
  rating: { avgRating: "desc" },
};

export function productRepository(prisma: PrismaClient) {
  return {
    /** Returns product ids ranked by full-text relevance for `q`, best matches first. */
    async searchRankedIds(q: string, limit = 200): Promise<string[]> {
      const rows = await prisma.$queryRaw<Array<{ id: string }>>`
        SELECT id FROM "Product"
        WHERE "isActive" = true AND "searchVector" @@ websearch_to_tsquery('english', ${q})
        ORDER BY ts_rank("searchVector", websearch_to_tsquery('english', ${q})) DESC
        LIMIT ${limit}
      `;
      return rows.map((r) => r.id);
    },

    async findMany(query: ProductListQuery, opts: { includeInactive?: boolean; rankedIds?: string[] } = {}) {
      const where: Prisma.ProductWhereInput = {
        isActive: opts.includeInactive ? undefined : true,
        ageGroup: query.ageGroup,
        isFeatured: query.isFeatured,
        category: query.categorySlug ? { slug: query.categorySlug } : undefined,
        priceInPaise:
          query.minPrice !== undefined || query.maxPrice !== undefined
            ? { gte: query.minPrice, lte: query.maxPrice }
            : undefined,
        id: opts.rankedIds ? { in: opts.rankedIds } : undefined,
      };

      const [total, rows] = await Promise.all([
        prisma.product.count({ where }),
        opts.rankedIds
          ? prisma.product.findMany({ where, include: productSummaryInclude })
          : prisma.product.findMany({
              where,
              include: productSummaryInclude,
              orderBy: SORT_MAP[query.sort],
              skip: paginationSkip(query.page, query.limit),
              take: query.limit,
            }),
      ]);

      if (opts.rankedIds) {
        const rank = new Map(opts.rankedIds.map((id, i) => [id, i]));
        rows.sort((a, b) => (rank.get(a.id) ?? 0) - (rank.get(b.id) ?? 0));
        const start = paginationSkip(query.page, query.limit);
        return { rows: rows.slice(start, start + query.limit), total: rows.length };
      }

      return { rows, total };
    },

    findBySlug(slug: string, opts: { includeInactive?: boolean } = {}) {
      return prisma.product.findFirst({
        where: { slug, isActive: opts.includeInactive ? undefined : true },
        include: productDetailInclude,
      });
    },

    findByIdAdmin(id: string) {
      return prisma.product.findUnique({ where: { id }, include: productDetailInclude });
    },

    findRelated(productId: string, categoryId: string, limit = 4) {
      return prisma.product.findMany({
        where: { categoryId, isActive: true, id: { not: productId } },
        include: productSummaryInclude,
        take: limit,
        orderBy: { avgRating: "desc" },
      });
    },

    findBySku(sku: string) {
      return prisma.product.findUnique({ where: { sku } });
    },

    create(data: Prisma.ProductCreateInput) {
      return prisma.product.create({ data, include: productDetailInclude });
    },

    update(id: string, data: Prisma.ProductUpdateInput) {
      return prisma.product.update({ where: { id }, data, include: productDetailInclude });
    },

    softDelete(id: string) {
      return prisma.product.update({ where: { id }, data: { isActive: false } });
    },

    decrementStock(id: string, quantity: number) {
      return prisma.product.update({ where: { id }, data: { stock: { decrement: quantity } } });
    },

    addImage(productId: string, data: { url: string; altText?: string; position: number; isPrimary: boolean }) {
      return prisma.productImage.create({ data: { ...data, productId } });
    },

    async unsetPrimaryImages(productId: string) {
      await prisma.productImage.updateMany({ where: { productId }, data: { isPrimary: false } });
    },

    removeImage(productId: string, imageId: string) {
      return prisma.productImage.deleteMany({ where: { id: imageId, productId } });
    },

    countImages(productId: string) {
      return prisma.productImage.count({ where: { productId } });
    },

    addVariant(productId: string, data: Omit<Prisma.ProductVariantCreateInput, "product">) {
      return prisma.productVariant.create({ data: { ...data, product: { connect: { id: productId } } } });
    },

    async updateVariant(productId: string, variantId: string, data: Prisma.ProductVariantUpdateInput) {
      // `update`'s where clause only accepts unique fields, so ownership
      // (variant belongs to this product) is verified with a findFirst
      // before updating by id alone.
      const owned = await prisma.productVariant.findFirst({ where: { id: variantId, productId } });
      if (!owned) return null;
      return prisma.productVariant.update({ where: { id: variantId }, data });
    },

    removeVariant(productId: string, variantId: string) {
      return prisma.productVariant.deleteMany({ where: { id: variantId, productId } });
    },

    findCategoryById(id: string) {
      return prisma.category.findUnique({ where: { id } });
    },
  };
}
export type ProductRepository = ReturnType<typeof productRepository>;
