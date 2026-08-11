import { Link } from "react-router-dom";
import { Button } from "@yrs/ui";

export function NotFoundPage() {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center px-5 py-24 text-center">
      <div className="font-display text-6xl text-gold">404</div>
      <h1 className="mt-4 text-2xl">We couldn't find that page</h1>
      <p className="mt-2 text-sm text-ink-soft">
        The page you're looking for may have been moved, or the link might be off by a letter.
      </p>
      <Link to="/" className="mt-8">
        <Button>Back to home</Button>
      </Link>
    </div>
  );
}
