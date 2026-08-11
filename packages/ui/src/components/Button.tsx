import { forwardRef } from "react";
import type { ButtonHTMLAttributes } from "react";
import { cn } from "../lib/cn.js";

export type ButtonVariant = "solid" | "outline" | "ghost" | "pill";
export type ButtonSize = "sm" | "md" | "lg";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
}

// `pill` (rounded-full) is reserved for small tags/chips/badges and the
// occasional secondary CTA — NOT the default site-wide button shape. The
// primary CTA language across the storefront and admin is the mockup-1
// solid-gold, rounded-md button.
const variantClasses: Record<ButtonVariant, string> = {
  solid:
    "bg-gold text-white hover:bg-gold-dark active:scale-[0.97] shadow-none",
  outline:
    "bg-transparent border border-gold text-gold-dark hover:bg-gold hover:text-white",
  ghost: "bg-transparent text-ink hover:bg-cream-dark",
  pill: "bg-gold text-white rounded-full hover:bg-gold-dark active:scale-[0.97]",
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: "text-xs px-3 py-2 gap-1.5",
  md: "text-[13.5px] px-6 py-3.5 gap-2",
  lg: "text-sm px-8 py-4 gap-2.5",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = "solid", size = "md", isLoading, className, children, disabled, ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      disabled={disabled || isLoading}
      className={cn(
        "inline-flex items-center justify-center font-body font-bold uppercase tracking-wider rounded transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed",
        variant !== "pill" && "rounded-md",
        variantClasses[variant],
        sizeClasses[size],
        className,
      )}
      {...props}
    >
      {isLoading ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" /> : children}
    </button>
  );
});
