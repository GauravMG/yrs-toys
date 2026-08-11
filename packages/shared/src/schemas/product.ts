import { z } from "zod";
import { AgeGroupEnum } from "../enums.js";

export const productImageSchema = z.object({
  id: z.string(),
  url: z.string(),
  altText: z.string().nullable(),
  position: z.number().int(),
  isPrimary: z.boolean(),
});
export type ProductImage = z.infer<typeof productImageSchema>;

export const productVariantSchema = z.object({
  id: z.string(),
  name: z.string(),
  value: z.string(),
  skuSuffix: z.string(),
  priceOverrideInPaise: z.number().int().nullable(),
  stockOverride: z.number().int().nullable(),
  isActive: z.boolean(),
});
export type ProductVariant = z.infer<typeof productVariantSchema>;

export const productVariantInputSchema = z.object({
  name: z.string().min(1).max(60),
  value: z.string().min(1).max(60),
  skuSuffix: z.string().min(1).max(30),
  priceOverrideInPaise: z.number().int().positive().optional(),
  stockOverride: z.number().int().min(0).optional(),
  isActive: z.boolean().optional(),
});
export type ProductVariantInput = z.infer<typeof productVariantInputSchema>;

export const productCategorySummarySchema = z.object({
  id: z.string(),
  name: z.string(),
  slug: z.string(),
});

export const productSummarySchema = z.object({
  id: z.string(),
  name: z.string(),
  slug: z.string(),
  shortDescription: z.string(),
  priceInPaise: z.number().int(),
  compareAtPriceInPaise: z.number().int().nullable(),
  ageGroup: AgeGroupEnum,
  isFeatured: z.boolean(),
  isActive: z.boolean(),
  stock: z.number().int(),
  avgRating: z.number(),
  reviewCount: z.number().int(),
  category: productCategorySummarySchema,
  primaryImage: productImageSchema.nullable(),
});
export type ProductSummary = z.infer<typeof productSummarySchema>;

export const productDetailSchema = productSummarySchema.extend({
  description: z.string(),
  sku: z.string(),
  material: z.string().nullable(),
  safetyInfo: z.string().nullable(),
  images: z.array(productImageSchema),
  variants: z.array(productVariantSchema),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type ProductDetail = z.infer<typeof productDetailSchema>;

export const productSortEnum = z.enum(["newest", "price_asc", "price_desc", "rating"]);
export type ProductSort = z.infer<typeof productSortEnum>;

export const productListQuerySchema = z.object({
  categorySlug: z.string().optional(),
  ageGroup: AgeGroupEnum.optional(),
  minPrice: z.coerce.number().int().min(0).optional(),
  maxPrice: z.coerce.number().int().min(0).optional(),
  q: z.string().max(120).optional(),
  sort: productSortEnum.default("newest"),
  isFeatured: z.coerce.boolean().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});
export type ProductListQuery = z.infer<typeof productListQuerySchema>;

export const productInputSchema = z.object({
  name: z.string().min(2).max(200),
  slug: z
    .string()
    .min(2)
    .max(220)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug must be lowercase kebab-case"),
  shortDescription: z.string().min(5).max(300),
  description: z.string().min(5),
  priceInPaise: z.number().int().positive(),
  compareAtPriceInPaise: z.number().int().positive().optional(),
  sku: z.string().min(2).max(60),
  stock: z.number().int().min(0),
  ageGroup: AgeGroupEnum,
  categoryId: z.string().min(1),
  material: z.string().max(200).optional(),
  safetyInfo: z.string().max(500).optional(),
  isFeatured: z.boolean().optional(),
  isActive: z.boolean().optional(),
});
export type ProductInput = z.infer<typeof productInputSchema>;

export const productUpdateSchema = productInputSchema.partial();
export type ProductUpdateInput = z.infer<typeof productUpdateSchema>;
