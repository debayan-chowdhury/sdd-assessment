import type { TransferRequestStatus } from "@/types/transferRequest";

const STATUS_CLASSES: Partial<Record<TransferRequestStatus, string>> = {
  Completed: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300",
  Rejected: "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300",
  Hold: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300",
};
const DEFAULT_CLASSES = "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300";

export function StatusBadge({ status }: { status: TransferRequestStatus }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_CLASSES[status] ?? DEFAULT_CLASSES}`}
    >
      {status}
    </span>
  );
}
