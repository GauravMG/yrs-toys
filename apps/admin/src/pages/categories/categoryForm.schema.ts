import { z } from "zod";
import type { Category, CategoryInput } from "@yrs/shared";

export const categoryFormSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(120),
  slug: z
    .string()
    .min(2, "Slug must be at least 2 characters")
    .max(140)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug must be lowercase kebab-case (e.g. wooden-toys)"),
  description: z.string().max(2000).optional().or(z.literal("")),
  imageUrl: z.union([z.string().url("Enter a valid URL"), z.literal("")]).optional(),
  parentId: z.string().optional().or(z.literal("")),
  isActive: z.boolean().optional(),
  sortOrder: z.coerce.number().int().optional(),
});
export type CategoryFormValues = z.infer<typeof categoryFormSchema>;

export const defaultCategoryFormValues: CategoryFormValues = {
  name: "",
  slug: "",
  description: "",
  imageUrl: "",
  parentId: "",
  isActive: true,
  sortOrder: 0,
};

export function toCategoryInput(values: CategoryFormValues): CategoryInput {
  return {
    name: values.name,
    slug: values.slug,
    description: values.description || undefined,
    imageUrl: values.imageUrl || undefined,
    parentId: values.parentId || null,
    isActive: values.isActive ?? true,
    sortOrder: values.sortOrder ?? 0,
  };
}

export function categoryToFormValues(category: Category): CategoryFormValues {
  return {
    name: category.name,
    slug: category.slug,
    description: category.description ?? "",
    imageUrl: category.imageUrl ?? "",
    parentId: category.parentId ?? "",
    isActive: category.isActive,
    sortOrder: category.sortOrder,
  };
}
