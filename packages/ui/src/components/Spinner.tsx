import { cn } from "../lib/cn.js";

export function Spinner({ className, size = 20 }: { className?: string; size?: number }) {
  return (
    <span
      role="status"
      aria-label="Loading"
      className={cn("inline-block animate-spin rounded-full border-2 border-gold/30 border-t-gold", className)}
      style={{ width: size, height: size }}
    />
  );
}
