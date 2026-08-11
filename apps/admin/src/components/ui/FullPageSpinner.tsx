import { Spinner } from "@yrs/ui";

export function FullPageSpinner() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-cream">
      <Spinner size={32} />
    </div>
  );
}
