import { cn } from "@yrs/ui";
import { AGE_GROUP_LABELS, AgeGroupEnum } from "@yrs/shared";
import type { AgeGroupValue } from "@yrs/shared";

export interface AgeFilterProps {
  value?: AgeGroupValue;
  onChange: (value: AgeGroupValue | undefined) => void;
}

export function AgeFilter({ value, onChange }: AgeFilterProps) {
  return (
    <div>
      <h3 className="mb-2 text-[13px] font-bold uppercase tracking-wider text-ink">Age group</h3>
      <div className="flex flex-wrap gap-2">
        {AgeGroupEnum.options.map((option) => (
          <button
            key={option}
            type="button"
            aria-pressed={value === option}
            onClick={() => onChange(value === option ? undefined : option)}
            className={cn(
              "rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-colors",
              value === option ? "border-gold bg-gold text-white" : "border-line text-ink-soft hover:border-gold hover:text-gold-dark",
            )}
          >
            {AGE_GROUP_LABELS[option]}
          </button>
        ))}
      </div>
    </div>
  );
}
