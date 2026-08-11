import { cn } from "../lib/cn.js";

export interface StarRatingProps {
  value: number;
  count?: number;
  size?: number;
  interactive?: boolean;
  onChange?: (value: number) => void;
  className?: string;
}

export function StarRating({ value, count, size = 15, interactive, onChange, className }: StarRatingProps) {
  const rounded = Math.round(value);
  return (
    <div className={cn("flex items-center gap-1", className)}>
      <span className="flex text-gold" style={{ fontSize: size }}>
        {Array.from({ length: 5 }, (_, i) => i + 1).map((star) => (
          <button
            key={star}
            type="button"
            disabled={!interactive}
            onClick={() => onChange?.(star)}
            className={cn("leading-none", interactive ? "cursor-pointer" : "cursor-default")}
            aria-label={interactive ? `Rate ${star} out of 5` : undefined}
          >
            {star <= rounded ? "★" : "☆"}
          </button>
        ))}
      </span>
      {typeof count === "number" && (
        <span className="text-[12.5px] text-ink-soft">({count} {count === 1 ? "review" : "reviews"})</span>
      )}
    </div>
  );
}
