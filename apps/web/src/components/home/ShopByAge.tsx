import { useNavigate } from "react-router-dom";
import { AGE_GROUP_LABELS } from "@yrs/shared";
import type { AgeGroupValue } from "@yrs/shared";

// Shown in this fixed youngest-to-oldest order; ALL_AGES is a catalog filter
// value, not a distinct life stage, so it's left out of this selector.
const AGE_GROUPS: { value: AgeGroupValue; icon: JSX.Element }[] = [
  {
    value: "AGE_0_1",
    icon: (
      <>
        <path d="M12 3a3 3 0 0 1 3 3c0 1.2-.6 2-1 2.6.6.3 1.4.7 1.9 1.6.9 1.6.4 3.4-.9 4.3-1.1.8-1.6 1.7-1.6 2.9 0 1.7-1.5 3.6-3.4 3.6S6.6 19.2 6.6 17.5c0-1.2-.5-2.1-1.6-2.9-1.3-.9-1.8-2.7-.9-4.3.5-.9 1.3-1.3 1.9-1.6-.4-.6-1-1.4-1-2.6a3 3 0 0 1 3-3" />
        <circle cx="9.5" cy="12" r="0.8" fill="currentColor" stroke="none" />
        <circle cx="14.5" cy="12" r="0.8" fill="currentColor" stroke="none" />
      </>
    ),
  },
  {
    value: "AGE_1_3",
    icon: (
      <>
        <circle cx="12" cy="11" r="7" />
        <circle cx="9.5" cy="10" r="0.8" fill="currentColor" stroke="none" />
        <circle cx="14.5" cy="10" r="0.8" fill="currentColor" stroke="none" />
        <path d="M9.5 13.5c.8.7 3.2.7 4 0" />
        <path d="M12 4V2" />
      </>
    ),
  },
  {
    value: "AGE_3_6",
    icon: (
      <>
        <circle cx="12" cy="11" r="7.5" />
        <circle cx="9.5" cy="9.5" r="0.8" fill="currentColor" stroke="none" />
        <circle cx="14.5" cy="9.5" r="0.8" fill="currentColor" stroke="none" />
        <path d="M8.8 13c1 1.3 4.4 1.3 5.4 0" />
        <path d="M8 5.5c1-1 6-1 7.4-.3" strokeLinecap="round" />
      </>
    ),
  },
  {
    value: "AGE_6_PLUS",
    icon: (
      <>
        <circle cx="12" cy="10.5" r="7" />
        <circle cx="9.5" cy="9.5" r="0.8" fill="currentColor" stroke="none" />
        <circle cx="14.5" cy="9.5" r="0.8" fill="currentColor" stroke="none" />
        <path d="M9 13c1 .9 4 .9 5 0" />
        <path d="M6 8.5c0-3 2-5 6-5" strokeLinecap="round" />
      </>
    ),
  },
];

export function ShopByAge() {
  const navigate = useNavigate();

  return (
    <section className="border-t border-line bg-cream-dark py-16">
      <div className="mx-auto max-w-[1240px] px-5 sm:px-8">
        <div className="mb-10 text-center">
          <h2 className="text-[28px] sm:text-[30px]">Shop by Age</h2>
          <div className="mx-auto mt-3.5 h-0.5 w-11 bg-gold" />
        </div>
        <div className="mx-auto grid max-w-[900px] grid-cols-2 gap-5 md:grid-cols-4">
          {AGE_GROUPS.map((group) => (
            <button
              key={group.value}
              type="button"
              onClick={() => navigate(`/shop?ageGroup=${group.value}`)}
              className="group flex flex-col items-center gap-3.5 p-1.5 text-center"
            >
              <div className="flex h-24 w-24 items-center justify-center rounded-full border border-line bg-panel transition-all duration-200 group-hover:-translate-y-1 group-hover:shadow-soft">
                <svg
                  width="42"
                  height="42"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={1.6}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="text-gold-dark"
                >
                  {group.icon}
                </svg>
              </div>
              <span className="text-[13.5px] font-medium text-ink-soft group-hover:text-gold-dark">
                {AGE_GROUP_LABELS[group.value]}
              </span>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
