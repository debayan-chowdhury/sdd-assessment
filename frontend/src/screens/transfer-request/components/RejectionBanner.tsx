export function RejectionBanner({ reason }: { reason: string | null }) {
  return (
    <div className="rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-800 dark:border-red-900 dark:bg-red-950 dark:text-red-200">
      <p className="font-medium">This request was rejected.</p>
      {reason && <p className="mt-1">{reason}</p>}
      <p className="mt-2">You&apos;ll need to submit a brand-new request to try again.</p>
    </div>
  );
}
