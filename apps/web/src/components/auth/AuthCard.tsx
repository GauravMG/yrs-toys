import type { ReactNode } from "react";

export function AuthCard({ title, subtitle, children }: { title: string; subtitle?: string; children: ReactNode }) {
  return (
    <div className="mx-auto flex min-h-[70vh] max-w-md flex-col justify-center px-5 py-16 sm:px-0">
      <div className="rounded-lg border border-line bg-panel p-8 shadow-card">
        <h1 className="font-display text-2xl text-ink">{title}</h1>
        {subtitle && <p className="mt-1.5 text-sm text-ink-soft">{subtitle}</p>}
        <div className="mt-6">{children}</div>
      </div>
    </div>
  );
}
