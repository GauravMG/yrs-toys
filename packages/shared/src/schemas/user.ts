import { z } from "zod";
import { optionalString } from "./common.js";

export const updateProfileSchema = z.object({
  fullName: z.string().min(2).max(120).optional(),
  phone: optionalString(z.string().regex(/^[6-9]\d{9}$/, "Enter a valid 10-digit Indian mobile number")),
});
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
