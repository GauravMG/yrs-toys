import { z } from "zod";
import { ReviewStatusEnum } from "../enums.js";

export const reviewInputSchema = z.object({
  rating: z.number().int().min(1).max(5),
  title: z.string().max(120).optional(),
  comment: z.string().min(5).max(2000),
});
export type ReviewInput = z.infer<typeof reviewInputSchema>;

export const reviewAuthorSchema = z.object({
  id: z.string(),
  fullName: z.string(),
});

export const reviewSchema = z.object({
  id: z.string(),
  productId: z.string(),
  user: reviewAuthorSchema,
  rating: z.number().int(),
  title: z.string().nullable(),
  comment: z.string(),
  isVerifiedPurchase: z.boolean(),
  status: ReviewStatusEnum,
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type Review = z.infer<typeof reviewSchema>;

export const moderateReviewSchema = z.object({
  status: z.enum(["APPROVED", "REJECTED"]),
});
export type ModerateReviewInput = z.infer<typeof moderateReviewSchema>;
