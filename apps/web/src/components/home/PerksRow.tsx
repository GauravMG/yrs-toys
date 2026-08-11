const ITEMS = [
  {
    title: "Perfect gifting",
    subtitle: "For every occasion",
    icon: <path d="M20 12v8H4v-8M2 7h20v5H2zM12 7v13M12 7c-1.5-3-6-4-6 0M12 7c1.5-3 6-4 6 0" />,
  },
  {
    title: "Exciting offers",
    subtitle: "For your little ones",
    icon: (
      <>
        <path d="M20.6 12.1L12 3.5H4v8l8.6 8.6a2 2 0 0 0 2.8 0l5.2-5.2a2 2 0 0 0 0-2.8z" />
        <circle cx="8.5" cy="7.5" r="1.2" />
      </>
    ),
  },
  {
    title: "Easy returns",
    subtitle: "Hassle free returns",
    icon: <path d="M21 8l-9-5-9 5 9 5 9-5zM3 8v8l9 5 9-5V8M12 13v8" />,
  },
  {
    title: "Secure payments",
    subtitle: "100% safe & secure",
    icon: (
      <>
        <rect x="5" y="11" width="14" height="9" rx="1.5" />
        <path d="M8 11V7a4 4 0 0 1 8 0v4" />
        <circle cx="12" cy="15.2" r="1.3" />
      </>
    ),
  },
];

export function PerksRow() {
  return (
    <section className="border-t border-line">
      <div className="mx-auto grid max-w-[1240px] grid-cols-2 gap-6 px-5 py-9 sm:px-8 md:grid-cols-4">
        {ITEMS.map((item) => (
          <div key={item.title} className="flex items-center gap-3.5">
            <svg
              className="h-8 w-8 flex-none text-gold-dark"
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
