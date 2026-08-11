import { describe, expect, it } from "vitest";
import { productFormSchema, toProductInput, type ProductFormValues } from "./productForm.schema";

const validValues: ProductFormValues = {
  name: "Wooden Train Set",
  slug: "wooden-train-set",
  shortDescription: "A classic wooden train.",
  description: "A classic wooden train set built to last.",
  price: 999.5,
  compareAtPrice: 1299,
  sku: "WTS-001",
  stock: 10,
  ageGroup: "AGE_3_6",
  categoryId: "cat_1",
  material: "Beechwood",
  safetyInfo: "No small parts.",
  isFeatured: true,
  isActive: true,
};

describe("productFormSchema", () => {
  it("accepts a fully valid set of values", () => {
    expect(productFormSchema.safeParse(validValues).success).toBe(true);
  });

  it("rejects a slug that isn't lowercase kebab-case", () => {
    const result = productFormSchema.safeParse({ ...validValues, slug: "Wooden Train Set" });
    expect(result.success).toBe(false);
  });

  it("rejects a non-positive price", () => {
    const result = productFormSchema.safeParse({ ...validValues, price: 0 });
    expect(result.success).toBe(false);
  });

  it("rejects a negative stock count", () => {
    const result = productFormSchema.safeParse({ ...validValues, stock: -1 });
    expect(result.success).toBe(false);
  });

  it("requires a category to be chosen", () => {
    const result = productFormSchema.safeParse({ ...validValues, categoryId: "" });
    expect(result.success).toBe(false);
  });
});

describe("toProductInput", () => {
  it("converts rupee price fields to integer paise for the API payload", () => {
    const payload = toProductInput(validValues);
    expect(payload.priceInPaise).toBe(99950);
    expect(payload.compareAtPriceInPaise).toBe(129900);
  });

  it("omits compareAtPriceInPaise when left blank", () => {
    const payload = toProductInput({ ...validValues, compareAtPrice: "" });
    expect(payload.compareAtPriceInPaise).toBeUndefined();
  });

  it("passes through the non-money fields untouched", () => {
    const payload = toProductInput(validValues);
    expect(payload).toMatchObject({
      name: "Wooden Train Set",
      slug: "wooden-train-set",
      sku: "WTS-001",
      stock: 10,
      ageGroup: "AGE_3_6",
      categoryId: "cat_1",
      isFeatured: true,
      isActive: true,
    });
  });
});
