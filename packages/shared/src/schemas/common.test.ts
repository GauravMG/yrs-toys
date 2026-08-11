import { describe, it, expect } from "vitest";
import { z } from "zod";
import { optionalString } from "./common.js";

describe("optionalString", () => {
  const schema = z.object({
    phone: optionalString(z.string().regex(/^[6-9]\d{9}$/, "invalid")),
  });

  it("accepts an empty string as absent (the uncontrolled-input default)", () => {
    const result = schema.safeParse({ phone: "" });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.phone).toBeUndefined();
  });

  it("accepts undefined as absent", () => {
    const result = schema.safeParse({});
    expect(result.success).toBe(true);
  });

  it("still validates a non-empty value against the wrapped schema", () => {
    expect(schema.safeParse({ phone: "9876543210" }).success).toBe(true);
    expect(schema.safeParse({ phone: "12345" }).success).toBe(false);
  });
});
