export function InfoStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-zinc-50 px-3 py-2 dark:bg-zinc-800/60">
      {/* The trailing colon isn't just decorative — on screens that also
          render a stepper/list with plain (colon-less) labels sharing the
          same words ("Current Manager", "Receiving HR", etc.), it keeps
          this label distinguishable under text queries. */}
      <dt className="text-xs text-zinc-500 dark:text-zinc-400">{label}:</dt>
      <dd className="mt-0.5 text-sm font-medium text-zinc-900 dark:text-zinc-100">{value}</dd>
    </div>
  );
}
