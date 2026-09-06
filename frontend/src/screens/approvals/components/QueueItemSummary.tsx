import { EscalationIndicator } from "@/screens/transfer-request/components/EscalationIndicator";
import type { TransferRequestDisplay } from "@/screens/approvals/useTransferRequestDisplay";

type QueueItemSummaryProps = TransferRequestDisplay & {
  effectiveDate: string;
  escalated?: boolean;
};

export function QueueItemSummary({
  employeeName,
  targetLocation,
  targetDepartment,
  targetRole,
  effectiveDate,
  escalated,
}: QueueItemSummaryProps) {
  return (
    <div className="flex items-start justify-between gap-2">
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-zinc-900 dark:text-zinc-50">{employeeName}</span>
          {escalated && <EscalationIndicator />}
        </div>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          {targetDepartment} · {targetLocation} · {targetRole}
        </p>
      </div>
      <span className="shrink-0 text-xs font-medium text-zinc-500 dark:text-zinc-400">
        Effective {effectiveDate}
      </span>
    </div>
  );
}
