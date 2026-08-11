import type {
  Paginated,
  ProductSummary,
  ProductDetail,
  ProductInput,
  ProductUpdateInput,
  ProductVariant,
  ProductVariantInput,
  ProductImage,
  ProductListQuery,
} from "@yrs/shared";
import { apiFetch } from "../api-client";
import { toQueryString } from "../query-string";

export type AdminProductListQuery = Partial<Omit<ProductListQuery, "page" | "limit">> & {
  page?: number;
  limit?: number;
};

export function listAdminProducts(query: AdminProductListQuery = {}): Promise<Paginated<ProductSummary>> {
  return apiFetch<Paginated<ProductSummary>>(`/admin/products${toQueryString(query)}`);
}

export function getAdminProduct(id: string): Promise<ProductDetail> {
  return apiFetch<ProductDetail>(`/admin/products/${id}`);
}

export function createProduct(input: ProductInput): Promise<ProductDetail> {
  return apiFetch<ProductDetail>("/admin/products", { method: "POST", body: input });
}

export function updateProduct(id: string, input: ProductUpdateInput): Promise<ProductDetail> {
  return apiFetch<ProductDetail>(`/admin/products/${id}`, { method: "PATCH", body: input });
}

export function deleteProduct(id: string): Promise<void> {
  return apiFetch<void>(`/admin/products/${id}`, { method: "DELETE" });
}

export function uploadProductImage(id: string, file: File): Promise<ProductImage> {
  const form = new FormData();
  form.set("file", file);
  return apiFetch<ProductImage>(`/admin/products/${id}/images`, { method: "POST", form });
}

export function deleteProductImage(id: string, imageId: string): Promise<void> {
  return apiFetch<void>(`/admin/products/${id}/images/${imageId}`, { method: "DELETE" });
}

export function addProductVariant(id: string, input: ProductVariantInput): Promise<ProductVariant> {
  return apiFetch<ProductVariant>(`/admin/products/${id}/variants`, { method: "POST", body: input });
}

export function updateProductVariant(
  id: string,
  variantId: string,
  input: Partial<ProductVariantInput>,
): Promise<ProductVariant> {
  return apiFetch<ProductVariant>(`/admin/products/${id}/variants/${variantId}`, { method: "PATCH", body: input });
}

export function deleteProductVariant(id: string, variantId: string): Promise<void> {
  return apiFetch<void>(`/admin/products/${id}/variants/${variantId}`, { method: "DELETE" });
}
