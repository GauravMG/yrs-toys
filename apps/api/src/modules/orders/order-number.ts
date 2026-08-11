import { randomInt } from "node:crypto";

/** e.g. YRS-20260811-4821 — date-scoped and random, not a DB sequence, so it never contends under concurrent checkouts. */
export function generateOrderNumber(now: Date = new Date()): string {
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  const suffix = String(randomInt(0, 10_000)).padStart(4, "0");
  return `YRS-${y}${m}${d}-${suffix}`;
}
