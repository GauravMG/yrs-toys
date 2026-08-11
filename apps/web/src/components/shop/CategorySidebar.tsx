import { cn } from "@yrs/ui";
import type { Category } from "@yrs/shared";

export interface CategorySidebarProps {
  categories: Category[];
  activeSlug?: string;
  onSelect: (slug: string | undefined) => void;
}

export function CategorySidebar({ categories, activeSlug, onSelect }: CategorySidebarProps) {
  return (
    <nav aria-label="Categories" className="flex flex-col gap-1">
      <h3 className="mb-2 text-[13px] font-bold uppercase tracking-wider text-ink">Categories</h3>
      <button
        type="button"
        onClick={() => onSelect(undefined)}
        className={cn(
          "rounded-md px-3 py-2 text-left text-sm transition-colors hover:bg-cream-dark",
          !activeSlug && "bg-gold/10 font-semibold text-gold-dark",
        )}
      >
        All categories
      </button>
      {categories.map((category) => (
        <button
          key={category.id}
          type="button"
          onClick={() => onSelect(category.slug)}
          className={cn(
            "rounded-md px-3 py-2 text-left text-sm transition-colors hover:bg-cream-dark",
            activeSlug === category.slug && "bg-gold/10 font-semibold text-gold-dark",
          )}
        >
          {category.name}
        </button>
      ))}
    </nav>
  );
}
