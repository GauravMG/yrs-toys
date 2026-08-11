import { forwardRef } from "react";
import type { SelectHTMLAttributes } from "react";
import { cn } from "../lib/cn.js";

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  error?: string;
  label?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { error, label, className, id, children, ...props },
  ref,
) {
  const selectId = id ?? props.name;
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={selectId} className="text-[13px] font-semibold text-ink-soft">
          {label}
        </label>
      )}
      <select
        ref={ref}
        id={selectId}
        className={cn(
          "w-full rounded-md border border-line bg-cream px-4 py-3 text-sm text-ink outline-none transition-colors focus:border-gold",
          error && "border-terracotta focus:border-terracotta",
          className,
        )}
        {...props}
      >
        {children}
      </select>
      {error && <span className="text-xs text-terracotta">{error}</span>}
    </div>
  );
});
