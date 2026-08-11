import { Badge, StarRating } from "@yrs/ui";
import { formatDate } from "@yrs/shared";
import type { Review } from "@yrs/shared";

export function ReviewList({ reviews }: { reviews: Review[] }) {
  if (reviews.length === 0) {
    return <p className="py-8 text-sm text-ink-soft">No reviews yet — be the first to share your thoughts.</p>;
  }

  return (
    <ul className="flex flex-col gap-6">
      {reviews.map((review) => (
        <li key={review.id} className="border-b border-line pb-6 last:border-b-0">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold">{review.user.fullName}</span>
                {review.isVerifiedPurchase && <Badge tone="teal">Verified purchase</Badge>}
              </div>
              <StarRating value={review.rating} className="mt-1" size={13} />
            </div>
            <span className="flex-none text-xs text-ink-soft">{formatDate(review.createdAt)}</span>
          </div>
          {review.title && <h4 className="mt-2.5 text-sm font-semibold">{review.title}</h4>}
          <p className="mt-1.5 text-sm leading-relaxed text-ink-soft">{review.comment}</p>
        </li>
      ))}
    </ul>
  );
}
