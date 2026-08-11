import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button, StarRating, Textarea, useToast } from "@yrs/ui";
import { reviewInputSchema } from "@yrs/shared";
import type { ReviewInput } from "@yrs/shared";
import { useCreateReview } from "../../hooks/useReviews";

export function ReviewForm({ slug }: { slug: string }) {
  const [showForm, setShowForm] = useState(false);
  const createReview = useCreateReview(slug);
  const { showToast } = useToast();
  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<ReviewInput>({
    resolver: zodResolver(reviewInputSchema),
    defaultValues: { rating: 5, title: "", comment: "" },
  });

  function onSubmit(values: ReviewInput) {
    createReview.mutate(values, {
      onSuccess: () => {
        showToast("Thanks for your review!");
        reset({ rating: 5, title: "", comment: "" });
        setShowForm(false);
      },
      onError: (error) => {
        showToast(error instanceof Error ? error.message : "Couldn't submit your review");
      },
    });
  }

  if (!showForm) {
    return (
      <Button variant="outline" size="sm" onClick={() => setShowForm(true)}>
        Write a review
      </Button>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4 rounded-lg border border-line p-5">
      <div>
        <label className="mb-1.5 block text-[13px] font-semibold text-ink-soft">Your rating</label>
        <Controller
          control={control}
          name="rating"
          render={({ field }) => <StarRating value={field.value} interactive onChange={field.onChange} size={22} />}
        />
        {errors.rating && <span className="mt-1 block text-xs text-terracotta">{errors.rating.message}</span>}
      </div>
      <div className="flex flex-col gap-1.5">
        <label htmlFor="review-title" className="text-[13px] font-semibold text-ink-soft">
          Title (optional)
        </label>
        <input
          id="review-title"
          {...register("title")}
          className="w-full rounded-md border border-line bg-cream px-4 py-3 text-sm text-ink outline-none focus:border-gold"
        />
      </div>
      <Textarea label="Your review" rows={4} error={errors.comment?.message} {...register("comment")} />
      <div className="flex gap-3">
        <Button type="submit" isLoading={createReview.isPending}>
          Submit review
        </Button>
        <Button type="button" variant="ghost" onClick={() => setShowForm(false)}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
