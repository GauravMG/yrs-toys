import { describe, it, expect } from "vitest";
import { toPaise, fromPaise, formatINR } from "./money.js";

describe("money utils", () => {
  it("converts rupees to paise", () => {
    expect(toPaise(599)).toBe(59900);
    expect(toPaise(19.5)).toBe(1950);
  });

  it("converts paise back to rupees", () => {
    expect(fromPaise(59900)).toBe(599);
    expect(fromPaise(1950)).toBe(19.5);
  });

  it("formats whole-rupee paise without decimals", () => {
    expect(formatINR(59900)).toBe("₹599");
  });

  it("formats fractional paise with decimals", () => {
    expect(formatINR(1950)).toBe("₹19.50");
  });
});
