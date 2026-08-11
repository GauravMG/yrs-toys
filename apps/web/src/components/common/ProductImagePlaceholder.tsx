import { cn } from "@yrs/ui";

/** Fallback art for products without an uploaded image, in the same warm
 * ink/gold palette as the rest of the storefront so an empty catalog entry
 * never looks broken. */
export function ProductImagePlaceholder({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 200 200" className={cn("h-full w-full", className)} aria-hidden="true">
      <rect x="45" y="55" width="110" height="110" rx="10" fill="#E6D9B8" />
      <path d="M45 65 L155 65" stroke="#C08A3E" strokeWidth="3" />
      <circle cx="80" cy="100" r="14" fill="#CC8064" />
      <rect x="105" y="88" width="24" height="24" rx="5" fill="#8FA073" transform="rotate(20 117 100)" />
      <path
        d="M60 130 l14 -18 14 18 14 -18 14 18"
        stroke="#C08A3E"
        strokeWidth="5"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="130" cy="140" r="9" fill="#D9A6A0" />
    </svg>
  );
}
