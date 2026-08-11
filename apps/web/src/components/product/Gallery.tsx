import { useState } from "react";
import { cn } from "@yrs/ui";
import type { ProductImage } from "@yrs/shared";
import { ProductImagePlaceholder } from "../common/ProductImagePlaceholder";

export function Gallery({ images, productName }: { images: ProductImage[]; productName: string }) {
  const sorted = [...images].sort((a, b) => a.position - b.position);
  const [activeIndex, setActiveIndex] = useState(0);
  const active = sorted[activeIndex];

  return (
    <div className="flex flex-col gap-3">
      <div className="flex aspect-square items-center justify-center overflow-hidden rounded-lg bg-cream-dark p-8">
        {active ? (
          <img src={active.url} alt={active.altText ?? productName} className="h-full w-full object-contain" />
        ) : (
          <ProductImagePlaceholder />
        )}
      </div>
      {sorted.length > 1 && (
        <div className="flex gap-2.5 overflow-x-auto">
          {sorted.map((image, index) => (
            <button
              key={image.id}
              type="button"
              onClick={() => setActiveIndex(index)}
              aria-label={`View image ${index + 1} of ${productName}`}
              className={cn(
                "flex h-16 w-16 flex-none items-center justify-center overflow-hidden rounded-md border bg-cream-dark p-1.5 transition-colors",
                index === activeIndex ? "border-gold" : "border-line hover:border-gold/50",
              )}
            >
              <img src={image.url} alt="" className="h-full w-full object-contain" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
