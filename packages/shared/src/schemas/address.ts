import { z } from "zod";

export const addressInputSchema = z.object({
  label: z.string().max(40).optional(),
  fullName: z.string().min(2).max(120),
  phone: z.string().regex(/^[6-9]\d{9}$/, "Enter a valid 10-digit Indian mobile number"),
  line1: z.string().min(3).max(200),
  line2: z.string().max(200).optional(),
  city: z.string().min(2).max(100),
  state: z.string().min(2).max(100),
  postalCode: z.string().regex(/^\d{6}$/, "Enter a valid 6-digit PIN code"),
  country: z.string().min(2).max(100).default("India"),
  isDefault: z.boolean().optional(),
});
export type AddressInput = z.infer<typeof addressInputSchema>;

export const addressSchema = addressInputSchema.extend({
  id: z.string(),
  userId: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type Address = z.infer<typeof addressSchema>;
