import type { Prisma } from "@yrs/db";
import type { ProductSummary, ProductDetail } from "@yrs/shared";

export const productSummaryInclude = {
  category: { select: { id: true, name: true, slug: true } },
  images: { orderBy: { position: "asc" as const } },
} satisfies Prisma.ProductInclude;

export type ProductWithSummaryRelations = Prisma.ProductGetPayload<{ include: typeof productSummaryInclude }>;

export const productDetailInclude = {
  category: { select: { id: true, name: true, slug: true } },
  images: { orderBy: { position: "asc" as const } },
  variants: true,
} satisfies Prisma.ProductInclude;

export type ProductWithDetailRelations = Prisma.ProductGetPayload<{ include: typeof productDetailInclude }>;

function primaryImage(images: ProductWithSummaryRelations["images"]) {
  const primary = images.find((i) => i.isPrimary) ?? images[0];
  return primary
    ? { id: primary.id, url: primary.url, altText: primary.altText, position: primary.position, isPrimary: primary.isPrimary }
    : null;
}

export function toProductSummary(product: ProductWithSummaryRelations): ProductSummary {
  return {
    id: product.id,
    name: product.name,
    slug: product.slug,
    shortDescription: product.shortDescription,
    priceInPaise: product.priceInPaise,
    compareAtPriceInPaise: product.compareAtPriceInPaise,
    ageGroup: product.ageGroup,
    isFeatured: product.isFeatured,
    isActive: product.isActive,
    stock: product.stock,
    avgRating: product.avgRating,
    reviewCount: product.reviewCount,
    category: product.category,
    primaryImage: primaryImage(product.images),
  };
}

export function toProductDetail(product: ProductWithDetailRelations): ProductDetail {
  return {
    ...toProductSummary(product),
    description: product.description,
    sku: product.sku,
    material: product.material,
    safetyInfo: product.safetyInfo,
    images: product.images.map((i) => ({
      id: i.id,
      url: i.url,
      altText: i.altText,
      position: i.position,
      isPrimary: i.isPrimary,
    })),
    variants: product.variants.map((v) => ({
      id: v.id,
      name: v.name,
      value: v.value,
      skuSuffix: v.skuSuffix,
      priceOverrideInPaise: v.priceOverrideInPaise,
      stockOverride: v.stockOverride,
      isActive: v.isActive,
    })),
    createdAt: product.createdAt.toISOString(),
    updatedAt: product.updatedAt.toISOString(),
  };
}
