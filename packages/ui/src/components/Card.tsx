import type { HTMLAttributes } from "react";
import { cn } from "../lib/cn.js";

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  hoverable?: boolean;
}

export function Card({ hoverable, className, children, ...props }: CardProps) {
  return (
    <div
      className={cn(
        "flex flex-col overflow-hidden rounded-lg border border-line bg-panel shadow-card",
        hoverable && "transition-all duration-300 ease-out hover:-translate-y-1.5 hover:shadow-soft",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}
