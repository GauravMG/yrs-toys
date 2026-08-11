import type { PrismaClient } from "@yrs/db";
import type { Category, CategoryInput } from "@yrs/shared";
import { NotFoundError, ConflictError } from "../../lib/http-errors.js";

type CategoryRow = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  imageUrl: string | null;
  parentId: string | null;
  isActive: boolean;
  sortOrder: number;
};

function toCategory(c: CategoryRow, children?: CategoryRow[]): Category {
  return {
    id: c.id,
    name: c.name,
    slug: c.slug,
    description: c.description,
    imageUrl: c.imageUrl,
    parentId: c.parentId,
    isActive: c.isActive,
    sortOrder: c.sortOrder,
    children: children ? children.map((child) => toCategory(child)) : undefined,
  };
}

export function categoryService(prisma: PrismaClient) {
  return {
    async tree(): Promise<Category[]> {
      const topLevel = await prisma.category.findMany({
        where: { parentId: null, isActive: true },
        orderBy: { sortOrder: "asc" },
        include: { children: { where: { isActive: true }, orderBy: { sortOrder: "asc" } } },
      });
      return topLevel.map((c) => toCategory(c, c.children));
    },

    async bySlug(slug: string): Promise<Category> {
      const category = await prisma.category.findUnique({
        where: { slug },
        include: { children: { where: { isActive: true }, orderBy: { sortOrder: "asc" } } },
      });
      if (!category || !category.isActive) throw new NotFoundError("Category not found");
      return toCategory(category, category.children);
    },

    async create(input: CategoryInput): Promise<Category> {
      const created = await prisma.category.create({ data: input });
      return toCategory(created);
    },

    async update(id: string, input: Partial<CategoryInput>): Promise<Category> {
      const existing = await prisma.category.findUnique({ where: { id } });
      if (!existing) throw new NotFoundError("Category not found");
      const updated = await prisma.category.update({ where: { id }, data: input });
      return toCategory(updated);
    },

    async remove(id: string): Promise<void> {
      const existing = await prisma.category.findUnique({ where: { id } });
      if (!existing) throw new NotFoundError("Category not found");

      const [productCount, childCount] = await Promise.all([
        prisma.product.count({ where: { categoryId: id } }),
        prisma.category.count({ where: { parentId: id } }),
      ]);
      if (productCount > 0 || childCount > 0) {
        throw new ConflictError("Cannot delete a category that has products or subcategories");
      }
      await prisma.category.delete({ where: { id } });
    },
  };
}
export type CategoryService = ReturnType<typeof categoryService>;
