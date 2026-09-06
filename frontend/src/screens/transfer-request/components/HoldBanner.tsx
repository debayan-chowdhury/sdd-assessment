export function HoldBanner({ reason }: { reason: string | null }) {
  return (
    <div className="rounded-md border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-200">
      <p className="font-medium">This request is on hold.</p>
      {reason && <p className="mt-1">{reason}</p>}
      <p className="mt-2">
        Receiving HR can reopen it within a 6-month window. No action is needed from you right now.
      </p>
    </div>
  );
}
