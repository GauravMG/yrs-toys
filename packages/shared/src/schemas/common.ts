import { z } from "zod";

/**
 * Wraps a format-validated schema (regex, `.email()`, etc.) so an empty
 * string is treated the same as "not provided". Plain `.optional()` only
 * accepts `undefined` — but uncontrolled HTML/React form inputs default to
 * `""`, not `undefined`, so a genuinely blank optional field (e.g. an
 * unfilled "Phone (optional)" box) would otherwise fail the regex and block
 * submission even though nothing invalid was entered.
 */
export function optionalString<T extends z.ZodTypeAny>(schema: T) {
  return z.preprocess((val) => (val === "" ? undefined : val), schema.optional());
}
