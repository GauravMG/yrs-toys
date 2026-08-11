import { z } from "zod";

export const categoryInputSchema = z.object({
  name: z.string().min(2).max(120),
  slug: z
    .string()
    .min(2)
    .max(140)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug must be lowercase kebab-case"),
  description: z.string().max(2000).optional(),
  imageUrl: z.string().url().optional(),
  parentId: z.string().nullable().optional(),
  isActive: z.boolean().optional(),
  sortOrder: z.number().int().optional(),
});
export type CategoryInput = z.infer<typeof categoryInputSchema>;

export const categorySchema: z.ZodType<{
  id: string;
  name: string;
  slug: string;
  description: string | null;
  imageUrl: string | null;
  parentId: string | null;
  isActive: boolean;
  sortOrder: number;
  children?: unknown[];
}> = z.lazy(() =>
  z.object({
    id: z.string(),
    name: z.string(),
    slug: z.string(),
    description: z.string().nullable(),
    imageUrl: z.string().nullable(),
    parentId: z.string().nullable(),
    isActive: z.boolean(),
    sortOrder: z.number(),
    children: z.array(categorySchema).optional(),
  }),
);
export type Category = z.infer<typeof categorySchema>;
