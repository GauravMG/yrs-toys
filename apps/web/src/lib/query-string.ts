/** Serializes a flat params object into a `?a=b&c=d` query string, dropping
 * undefined/null/empty-string values so callers can pass sparse filter
 * objects straight from URLSearchParams state without manual pruning. */
export function toQueryString(params: Record<string, unknown>): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === "") continue;
    search.set(key, String(value));
  }
  const qs = search.toString();
  return qs ? `?${qs}` : "";
}
