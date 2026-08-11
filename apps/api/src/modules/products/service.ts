import type { PrismaClient } from "@yrs/db";
import type {
  ProductListQuery,
  ProductSummary,
  ProductDetail,
  ProductInput,
  ProductUpdateInput,
  ProductVariantInput,
  Paginated,
} from "@yrs/shared";
import { productRepository } from "./repository.js";
import { toProductSummary, toProductDetail } from "../../lib/product-mapper.js";
import { buildPaginated } from "../../lib/pagination.js";
import { NotFoundError, BadRequestError } from "../../lib/http-errors.js";
import { saveFile, isAllowedImageMimeType } from "../uploads/storage-adapter.js";

export function productService(prisma: PrismaClient) {
  const repo = productRepository(prisma);

  return {
    async list(query: ProductListQuery, opts: { includeInactive?: boolean } = {}): Promise<Paginated<ProductSummary>> {
      const rankedIds = query.q ? await repo.searchRankedIds(query.q) : undefined;
      const { rows, total } = await repo.findMany(query, { includeInactive: opts.includeInactive, rankedIds });
      return buildPaginated(rows.map(toProductSummary), total, query.page, query.limit);
    },

    async getBySlug(slug: string, opts: { includeInactive?: boolean } = {}): Promise<ProductDetail> {
      const product = await repo.findBySlug(slug, opts);
      if (!product) throw new NotFoundError("Product not found");
      return toProductDetail(product);
    },

    async getByIdAdmin(id: string): Promise<ProductDetail> {
      const product = await repo.findByIdAdmin(id);
      if (!product) throw new NotFoundError("Product not found");
      return toProductDetail(product);
    },

    async getRelated(slug: string): Promise<ProductSummary[]> {
      const product = await repo.findBySlug(slug, { includeInactive: true });
      if (!product) throw new NotFoundError("Product not found");
      const related = await repo.findRelated(product.id, product.categoryId);
      return related.map(toProductSummary);
    },

    async create(input: ProductInput): Promise<ProductDetail> {
      const category = await repo.findCategoryById(input.categoryId);
      if (!category) throw new BadRequestError("Unknown categoryId");

      const created = await repo.create({
        name: input.name,
        slug: input.slug,
        shortDescription: input.shortDescription,
        description: input.description,
        priceInPaise: input.priceInPaise,
        compareAtPriceInPaise: input.compareAtPriceInPaise,
        sku: input.sku,
        stock: input.stock,
        ageGroup: input.ageGroup,
        category: { connect: { id: input.categoryId } },
        material: input.material,
        safetyInfo: input.safetyInfo,
        isFeatured: input.isFeatured ?? false,
        isActive: input.isActive ?? true,
      });
      return toProductDetail(created);
    },

    async update(id: string, input: ProductUpdateInput): Promise<ProductDetail> {
      const { categoryId, ...rest } = input;
      if (categoryId) {
        const category = await repo.findCategoryById(categoryId);
        if (!category) throw new BadRequestError("Unknown categoryId");
      }
      const existing = await repo.findByIdAdmin(id);
      if (!existing) throw new NotFoundError("Product not found");

      const updated = await repo.update(id, {
        ...rest,
        category: categoryId ? { connect: { id: categoryId } } : undefined,
      });
      return toProductDetail(updated);
    },

    async softDelete(id: string): Promise<void> {
      const existing = await repo.findByIdAdmin(id);
      if (!existing) throw new NotFoundError("Product not found");
      await repo.softDelete(id);
    },

    async addImage(
      productId: string,
      file: { buffer: Buffer; filename: string; mimeType: string },
      opts: { isPrimary?: boolean } = {},
    ) {
      const existing = await repo.findByIdAdmin(productId);
      if (!existing) throw new NotFoundError("Product not found");
      if (!isAllowedImageMimeType(file.mimeType)) {
        throw new BadRequestError("Only JPEG, PNG, WebP or AVIF images are allowed");
      }

      const stored = await saveFile(file.buffer, file.filename);
      const existingCount = await repo.countImages(productId);
      const makesPrimary = opts.isPrimary ?? existingCount === 0;
      if (makesPrimary) await repo.unsetPrimaryImages(productId);

      return repo.addImage(productId, {
        url: stored.url,
        altText: existing.name,
        position: existingCount,
        isPrimary: makesPrimary,
      });
    },

    async removeImage(productId: string, imageId: string): Promise<void> {
      const result = await repo.removeImage(productId, imageId);
      if (result.count === 0) throw new NotFoundError("Image not found");
    },

    async addVariant(productId: string, input: ProductVariantInput) {
      const existing = await repo.findByIdAdmin(productId);
      if (!existing) throw new NotFoundError("Product not found");
      return repo.addVariant(productId, input);
    },

    async updateVariant(productId: string, variantId: string, input: Partial<ProductVariantInput>) {
      const updated = await repo.updateVariant(productId, variantId, input);
      if (!updated) throw new NotFoundError("Variant not found");
      return updated;
    },

    async removeVariant(productId: string, variantId: string): Promise<void> {
      const result = await repo.removeVariant(productId, variantId);
      if (result.count === 0) throw new NotFoundError("Variant not found");
    },
  };
}
export type ProductService = ReturnType<typeof productService>;
