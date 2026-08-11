import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { Button, Input } from "@yrs/ui";

export interface PriceRangeFilterProps {
  minPrice?: number;
  maxPrice?: number;
  onApply: (minPrice: number | undefined, maxPrice: number | undefined) => void;
}

/** Prices here are plain rupees (not paise) for a friendlier filter UI;
 * converted to paise at the call site before hitting the API. */
export function PriceRangeFilter({ minPrice, maxPrice, onApply }: PriceRangeFilterProps) {
  const [min, setMin] = useState(minPrice?.toString() ?? "");
  const [max, setMax] = useState(maxPrice?.toString() ?? "");

  useEffect(() => {
    setMin(minPrice?.toString() ?? "");
    setMax(maxPrice?.toString() ?? "");
  }, [minPrice, maxPrice]);

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    onApply(min ? Number(min) : undefined, max ? Number(max) : undefined);
  }

  return (
    <form onSubmit={handleSubmit}>
      <h3 className="mb-2 text-[13px] font-bold uppercase tracking-wider text-ink">Price (₹)</h3>
      <div className="flex items-center gap-2">
        <Input type="number" min={0} placeholder="Min" aria-label="Minimum price" value={min} onChange={(e) => setMin(e.target.value)} />
        <span className="text-ink-soft">–</span>
        <Input type="number" min={0} placeholder="Max" aria-label="Maximum price" value={max} onChange={(e) => setMax(e.target.value)} />
      </div>
      <Button type="submit" variant="outline" size="sm" className="mt-3 w-full">
        Apply
      </Button>
    </form>
  );
}
