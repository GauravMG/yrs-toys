import { cn } from "@yrs/ui";

export interface PaginationProps {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export function Pagination({ page, totalPages, onPageChange }: PaginationProps) {
  if (totalPages <= 1) return null;

  const pages = Array.from({ length: totalPages }, (_, i) => i + 1);

  return (
    <nav aria-label="Pagination" className="flex items-center justify-center gap-1.5 py-10">
      <button
        type="button"
        disabled={page <= 1}
        onClick={() => onPageChange(page - 1)}
        aria-label="Previous page"
        className="flex h-9 w-9 items-center justify-center rounded-md border border-line text-ink transition-colors hover:border-gold hover:text-gold-dark disabled:cursor-not-allowed disabled:opacity-40"
      >
        ‹
      </button>
      {pages.map((p) => (
        <button
          key={p}
          type="button"
          onClick={() => onPageChange(p)}
          aria-current={p === page ? "page" : undefined}
          className={cn(
            "flex h-9 w-9 items-center justify-center rounded-md border text-sm transition-colors",
            p === page ? "border-gold bg-gold text-white" : "border-line text-ink hover:border-gold hover:text-gold-dark",
          )}
        >
          {p}
        </button>
      ))}
      <button
        type="button"
        disabled={page >= totalPages}
        onClick={() => onPageChange(page + 1)}
        aria-label="Next page"
        className="flex h-9 w-9 items-center justify-center rounded-md border border-line text-ink transition-colors hover:border-gold hover:text-gold-dark disabled:cursor-not-allowed disabled:opacity-40"
      >
        ›
      </button>
    </nav>
  );
}
