import type { Category, CategoryInput } from "@yrs/shared";
import { apiFetch } from "../api-client";

export function listCategories(): Promise<Category[]> {
  return apiFetch<Category[]>("/categories");
}

export function createCategory(input: CategoryInput): Promise<Category> {
  return apiFetch<Category>("/admin/categories", { method: "POST", body: input });
}

export function updateCategory(id: string, input: Partial<CategoryInput>): Promise<Category> {
  return apiFetch<Category>(`/admin/categories/${id}`, { method: "PATCH", body: input });
}

export function deleteCategory(id: string): Promise<void> {
  return apiFetch<void>(`/admin/categories/${id}`, { method: "DELETE" });
}
