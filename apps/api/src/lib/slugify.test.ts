import { describe, it, expect } from "vitest";
import { slugify } from "./slugify.js";

describe("slugify", () => {
  it("lowercases and hyphenates", () => {
    expect(slugify("Rainbow Ring Stacker")).toBe("rainbow-ring-stacker");
  });

  it("strips punctuation", () => {
    expect(slugify("Kid's Toy! (Best-Seller)")).toBe("kid-s-toy-best-seller");
  });

  it("trims leading/trailing hyphens", () => {
    expect(slugify("  --Hello World--  ")).toBe("hello-world");
  });
});
