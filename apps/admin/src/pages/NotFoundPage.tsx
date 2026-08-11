import { Link } from "react-router-dom";
import { Button } from "@yrs/ui";

export function NotFoundPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-cream text-center">
      <p className="font-display text-5xl text-ink">404</p>
      <p className="text-sm text-ink-soft">This page doesn&apos;t exist.</p>
      <Link to="/dashboard">
        <Button type="button" variant="solid">
          Back to dashboard
        </Button>
      </Link>
    </div>
  );
}
