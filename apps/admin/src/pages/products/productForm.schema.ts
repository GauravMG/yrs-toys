import { z } from "zod";
import { AgeGroupEnum, toPaise, fromPaise } from "@yrs/shared";
import type { ProductDetail, ProductInput } from "@yrs/shared";

/**
 * Mirrors `productInputSchema` from @yrs/shared, except price fields are
 * entered by the admin in rupees (not integer paise) for usability — this
 * schema validates the rupee form values, and `toProductInput` converts to
 * the paise-integer payload the API actually expects.
 */
export const productFormSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(200),
  slug: z
    .string()
    .min(2, "Slug must be at least 2 characters")
    .max(220)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug must be lowercase kebab-case (e.g. wooden-train-set)"),
  shortDescription: z.string().min(5, "Short description must be at least 5 characters").max(300),
  description: z.string().min(5, "Description must be at least 5 characters"),
  price: z.coerce.number({ invalid_type_error: "Enter a price" }).positive("Price must be greater than 0"),
  compareAtPrice: z.union([z.coerce.number().positive(), z.literal("")]).optional(),
  sku: z.string().min(2, "SKU must be at least 2 characters").max(60),
  stock: z.coerce.number({ invalid_type_error: "Enter a stock count" }).int().min(0, "Stock can't be negative"),
  ageGroup: AgeGroupEnum,
  categoryId: z.string().min(1, "Choose a category"),
  material: z.string().max(200).optional().or(z.literal("")),
  safetyInfo: z.string().max(500).optional().or(z.literal("")),
  isFeatured: z.boolean().optional(),
  isActive: z.boolean().optional(),
});
export type ProductFormValues = z.infer<typeof productFormSchema>;

export function toProductInput(values: ProductFormValues): ProductInput {
  const compareAtPrice = values.compareAtPrice === "" || values.compareAtPrice === undefined ? undefined : values.compareAtPrice;
  return {
    name: values.name,
    slug: values.slug,
    shortDescription: values.shortDescription,
    description: values.description,
    priceInPaise: toPaise(values.price),
    compareAtPriceInPaise: compareAtPrice !== undefined ? toPaise(compareAtPrice) : undefined,
    sku: values.sku,
    stock: values.stock,
    ageGroup: values.ageGroup,
    categoryId: values.categoryId,
    material: values.material || undefined,
    safetyInfo: values.safetyInfo || undefined,
    isFeatured: values.isFeatured ?? false,
    isActive: values.isActive ?? true,
  };
}

export function productToFormValues(product: ProductDetail): ProductFormValues {
  return {
    name: product.name,
    slug: product.slug,
    shortDescription: product.shortDescription,
    description: product.description,
    price: fromPaise(product.priceInPaise),
    compareAtPrice: product.compareAtPriceInPaise != null ? fromPaise(product.compareAtPriceInPaise) : "",
    sku: product.sku,
    stock: product.stock,
    ageGroup: product.ageGroup,
    categoryId: product.category.id,
    material: product.material ?? "",
    safetyInfo: product.safetyInfo ?? "",
    isFeatured: product.isFeatured,
    isActive: product.isActive,
  };
}

export const defaultProductFormValues: ProductFormValues = {
  name: "",
  slug: "",
  shortDescription: "",
  description: "",
  price: 0,
  compareAtPrice: "",
  sku: "",
  stock: 0,
  ageGroup: "ALL_AGES",
  categoryId: "",
  material: "",
  safetyInfo: "",
  isFeatured: false,
  isActive: true,
};
