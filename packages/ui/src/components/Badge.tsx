import type { HTMLAttributes } from "react";
import { cn } from "../lib/cn.js";

export type BadgeTone = "gold" | "terracotta" | "coral" | "teal" | "sage" | "ink";

// bg-gold = "New", bg-terracotta = "Bestseller", bg-coral = "Sale" (the one
// borrowed accent, used nowhere else), bg-teal = "In stock" / "Verified
// purchase" indicators. See packages/ui/src/tokens/colors.ts.
const toneClasses: Record<BadgeTone, string> = {
  gold: "bg-gold text-white",
  terracotta: "bg-terracotta text-white",
  coral: "bg-coral text-white",
  teal: "bg-teal text-white",
  sage: "bg-sage text-white",
  ink: "bg-ink text-cream",
};

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: BadgeTone;
}

export function Badge({ tone = "gold", className, children, ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md px-2.5 py-1 text-[10.5px] font-bold uppercase tracking-wider",
        toneClasses[tone],
        className,
      )}
      {...props}
    >
      {children}
    </span>
  );
}
