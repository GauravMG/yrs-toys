import { ApiError } from "../../lib/api-client";

/** Surfaces API error messages verbatim (e.g. a 409 "category is in use") rather than a generic "something went wrong". */
export function ErrorBanner({ error }: { error: unknown }) {
  if (!error) return null;
  const message = error instanceof ApiError ? error.message : error instanceof Error ? error.message : "Something went wrong.";
  return (
    <div role="alert" className="rounded-md border border-terracotta bg-terracotta/10 px-4 py-3 text-sm text-terracotta">
      {message}
    </div>
  );
}
