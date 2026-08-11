const ITEMS = [
  {
    title: "Safe & non toxic",
    subtitle: "Child safe materials",
    icon: (
      <>
        <path d="M12 2l8 3v6c0 5-3.4 8.7-8 10-4.6-1.3-8-5-8-10V5l8-3z" />
        <path d="M9 12l2 2 4-4" />
      </>
    ),
  },
  {
    title: "Eco friendly",
    subtitle: "Sustainable & durable",
    icon: <path d="M5 21c8 0 14-6 14-14 0-1 0-2-.3-3C10 5 5 11 5 19v2z" />,
  },
  {
    title: "Premium quality",
    subtitle: "Built to last",
    icon: <path d="M12 3l2.6 5.9 6.4.6-4.8 4.3 1.4 6.3L12 16.9 6.4 20.1l1.4-6.3L3 9.5l6.4-.6z" />,
  },
  {
    title: "Fast delivery",
    subtitle: "Pan India delivery",
    icon: (
      <>
        <path d="M3 7h11v9H3zM14 10h4l3 3v3h-7z" />
        <circle cx="7" cy="18" r="1.6" />
        <circle cx="17.5" cy="18" r="1.6" />
      </>
    ),
  },
];

export function TrustBadges() {
  return (
    <section className="border-y border-line bg-cream-dark">
      <div className="mx-auto grid max-w-[1240px] grid-cols-2 gap-6 px-5 py-8 sm:px-8 md:grid-cols-4">
        {ITEMS.map((item) => (
          <div key={item.title} className="flex items-center gap-3.5">
            <svg
              className="h-9 w-9 flex-none text-gold-dark"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.6}
            >
              {item.icon}
            </svg>
            <div>
              <strong className="block text-[13.5px]">{item.title}</strong>
              <span className="block text-xs text-ink-soft">{item.subtitle}</span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
