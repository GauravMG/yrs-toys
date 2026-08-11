import type { Category } from "@yrs/shared";

export interface FlatCategory {
  id: string;
  name: string;
  depth: number;
}

/** Flattens the nested category tree returned by GET /categories into a depth-indented list, for <select> options. */
export function flattenCategories(categories: Category[], depth = 0): FlatCategory[] {
  return categories.flatMap((category) => [
    { id: category.id, name: category.name, depth },
    ...flattenCategories((category.children as Category[] | undefined) ?? [], depth + 1),
  ]);
}

/** Flattens the nested category tree into a plain list of full Category objects (e.g. to find one by id regardless of depth). */
export function flattenCategoryTree(categories: Category[]): Category[] {
  return categories.flatMap((category) => [
    category,
    ...flattenCategoryTree((category.children as Category[] | undefined) ?? []),
  ]);
}
