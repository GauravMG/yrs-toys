import { cn } from "@yrs/ui";
import type { ProductVariant } from "@yrs/shared";

export interface VariantPickerProps {
  variants: ProductVariant[];
  selectedVariantId: string | null;
  onChange: (variantId: string) => void;
}

export function VariantPicker({ variants, selectedVariantId, onChange }: VariantPickerProps) {
  const active = variants.filter((v) => v.isActive);
  const groups = new Map<string, ProductVariant[]>();
  for (const variant of active) {
    const group = groups.get(variant.name) ?? [];
    group.push(variant);
    groups.set(variant.name, group);
  }

  return (
    <div className="flex flex-col gap-4">
      {Array.from(groups.entries()).map(([name, options]) => (
        <div key={name}>
          <h3 className="mb-2 text-[13px] font-bold uppercase tracking-wider text-ink">{name}</h3>
          <div className="flex flex-wrap gap-2">
            {options.map((variant) => {
              const isOutOfStock = variant.stockOverride !== null && variant.stockOverride <= 0;
              return (
                <button
                  key={variant.id}
                  type="button"
                  disabled={isOutOfStock}
                  onClick={() => onChange(variant.id)}
                  aria-pressed={selectedVariantId === variant.id}
                  className={cn(
                    "rounded-md border px-4 py-2 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-40",
                    selectedVariantId === variant.id
                      ? "border-gold bg-gold text-white"
                      : "border-line text-ink hover:border-gold hover:text-gold-dark",
                  )}
                >
                  {variant.value}
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
