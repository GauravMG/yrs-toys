import { describe, it, expect } from "vitest";
import { generateOrderNumber } from "./order-number.js";

describe("generateOrderNumber", () => {
  it("matches the YRS-YYYYMMDD-NNNN format", () => {
    const number = generateOrderNumber(new Date("2026-08-11T10:00:00Z"));
    expect(number).toMatch(/^YRS-20260811-\d{4}$/);
  });

  it("produces different suffixes across calls (not a fixed sequence)", () => {
    const numbers = new Set(Array.from({ length: 20 }, () => generateOrderNumber()));
    expect(numbers.size).toBeGreaterThan(1);
  });
});
