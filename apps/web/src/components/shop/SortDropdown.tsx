import { Select } from "@yrs/ui";
import type { ProductSort } from "@yrs/shared";

const SORT_LABELS: Record<ProductSort, string> = {
  newest: "Newest",
  price_asc: "Price: Low to High",
  price_desc: "Price: High to Low",
  rating: "Top Rated",
};

export function SortDropdown({ value, onChange }: { value: ProductSort; onChange: (value: ProductSort) => void }) {
  return (
    <Select aria-label="Sort products" value={value} onChange={(e) => onChange(e.target.value as ProductSort)} className="w-auto">
      {Object.entries(SORT_LABELS).map(([key, label]) => (
        <option key={key} value={key}>
          {label}
        </option>
      ))}
    </Select>
  );
}
