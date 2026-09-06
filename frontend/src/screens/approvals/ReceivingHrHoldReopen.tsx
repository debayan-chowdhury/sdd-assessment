"use client";

import { useState } from "react";
import { useAuthStore } from "@/features/auth/auth.store";
import { useReceivingHrHoldQueue } from "@/features/transfer-request/transfer-request.queries";
import { useReopenHold } from "@/features/transfer-request/transfer-request.mutations";
import { useTransferRequestDisplay } from "@/screens/approvals/useTransferRequestDisplay";
import { QueueCard, QueueSection } from "@/screens/approvals/components/QueueSection";
import { QueueItemSummary } from "@/screens/approvals/components/QueueItemSummary";
import { ManagerPicker } from "@/components/ui/ManagerPicker";
import { Button } from "@/components/ui/Button";
import { apiErrorCode } from "@/lib/apiError";
import type { TransferRequest } from "@/types/transferRequest";

export function ReceivingHrHoldReopen() {
  const roleCategory = useAuthStore((state) => state.employee?.roleCategory ?? null);
  const queueQuery = useReceivingHrHoldQueue(roleCategory === "HR");
  const reopen = useReopenHold();
  const { describe } = useTransferRequestDisplay(queueQuery.data ?? []);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [managerByRequest, setManagerByRequest] = useState<Record<string, string>>({});
  const [managerError, setManagerError] = useState<Record<string, string>>({});
  const [expiredIds, setExpiredIds] = useState<Set<string>>(new Set());
  const [message, setMessage] = useState<string | null>(null);

  if (roleCategory !== "HR") return null;
  if (queueQuery.isLoading || !queueQuery.data) return null;
  const requests = queueQuery.data;

  function handleReopen(request: TransferRequest) {
    const assignedManagerId = managerByRequest[request.id];
    if (!assignedManagerId) {
      setManagerError((prev) => ({ ...prev, [request.id]: "Select a manager before reopening." }));
      return;
    }
    setManagerError((prev) => ({ ...prev, [request.id]: "" }));
    setPendingId(request.id);
    setMessage(null);
    reopen.mutate(
      { id: request.id, assignedManagerId },
      {
        onSuccess: () => {
          setPendingId(null);
          setMessage("Reopened — the request is back in the active queue.");
        },
        onError: (error) => {
          setPendingId(null);
          const code = apiErrorCode(error);
          if (code === "HOLD_WINDOW_EXPIRED") {
            setExpiredIds((prev) => new Set(prev).add(request.id));
            setMessage("The 6-month hold window has passed — this request can no longer be reopened.");
            return;
          }
          if (code === "INVALID_MANAGER_ROLE") {
            setManagerError((prev) => ({
              ...prev,
              [request.id]: "This person isn't a valid Manager for that Department+Location.",
            }));
            return;
          }
          setMessage("Something went wrong. Please try again.");
        },
      }
    );
  }

  return (
    <QueueSection
      title="Receiving HR — Hold"
      isEmpty={requests.length === 0}
      emptyMessage="No requests currently on hold."
      message={message}
    >
      {requests.map((request) => {
        const display = describe(request);
        const submitting = pendingId === request.id && reopen.isPending;
        const expired = expiredIds.has(request.id);
        return (
          <QueueCard key={request.id}>
            <QueueItemSummary {...display} effectiveDate={request.effectiveDate} escalated={request.escalated} />
            {request.holdReason && (
              <p className="text-sm text-zinc-600 dark:text-zinc-400">Hold reason: {request.holdReason}</p>
            )}
            {expired ? (
              <p role="alert" className="text-sm text-red-600 dark:text-red-400">
                The 6-month hold window has expired — no further reopen action is available.
              </p>
            ) : (
              <>
                <ManagerPicker
                  locationId={request.newLocationId}
                  departmentId={request.newDepartmentId}
                  value={managerByRequest[request.id] ?? ""}
                  onChange={(value) => setManagerByRequest((prev) => ({ ...prev, [request.id]: value }))}
                  error={managerError[request.id]}
                />
                <Button type="button" loading={submitting} onClick={() => handleReopen(request)}>
                  Reopen
                </Button>
              </>
            )}
          </QueueCard>
        );
      })}
    </QueueSection>
  );
}
