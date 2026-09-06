type QueueSectionProps = {
  title: string;
  isEmpty: boolean;
  emptyMessage: string;
  message?: string | null;
  children: React.ReactNode;
};

export function QueueSection({ title, isEmpty, emptyMessage, message, children }: QueueSectionProps) {
  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-50">{title}</h2>
      {message && (
        <p
          role="status"
          className="rounded-lg bg-emerald-50 px-3 py-2.5 text-sm text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
        >
          {message}
        </p>
      )}
      {isEmpty ? (
        <p className="rounded-2xl border border-dashed border-zinc-300 bg-white px-4 py-6 text-center text-sm text-zinc-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-400">
          {emptyMessage}
        </p>
      ) : (
        <ul className="flex flex-col gap-3">{children}</ul>
      )}
    </section>
  );
}

export function QueueCard({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex flex-col gap-3 rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      {children}
    </li>
  );
}
