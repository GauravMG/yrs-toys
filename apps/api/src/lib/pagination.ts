import type { Paginated } from "@yrs/shared";

export function buildPaginated<T>(items: T[], total: number, page: number, limit: number): Paginated<T> {
  return {
    items,
    total,
    page,
    limit,
    totalPages: Math.max(1, Math.ceil(total / limit)),
  };
}

export function paginationSkip(page: number, limit: number): number {
  return (page - 1) * limit;
}
