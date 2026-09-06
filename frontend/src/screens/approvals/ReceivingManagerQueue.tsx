"use client";

import { useState } from "react";
import { useAuthStore } from "@/features/auth/auth.store";
import { useReceivingManagerQueue } from "@/features/transfer-request/transfer-request.queries";
import { useReceivingManagerDecision } from "@/features/transfer-request/transfer-request.mutations";
import { useTransferRequestDisplay } from "@/screens/approvals/useTransferRequestDisplay";
import { QueueCard, QueueSection } from "@/screens/approvals/components/QueueSection";
import { QueueItemSummary } from "@/screens/approvals/components/QueueItemSummary";
import { ReasonCodeDialog } from "@/components/ui/ReasonCodeDialog";
import { Button } from "@/components/ui/Button";
import { apiErrorCode } from "@/lib/apiError";
import type { ReceivingManagerRejectReasonCode, TransferRequest } from "@/types/transferRequest";

export function ReceivingManagerQueue() {
  const roleCategory = useAuthStore((state) => state.employee?.roleCategory ?? null);
  const queueQuery = useReceivingManagerQueue(roleCategory === "Manager");
  const decision = useReceivingManagerDecision();
  const { describe } = useTransferRequestDisplay(queueQuery.data ?? []);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  if (roleCategory !== "Manager") return null;
  if (queueQuery.isLoading || !queueQuery.data) return null;

  const requests = queueQuery.data;

  function onError(error: unknown) {
    setPendingId(null);
    const code = apiErrorCode(error);
    if (code === "INVALID_STATUS_TRANSITION") {
      setMessage("This request is no longer pending your approval — it's been removed from your queue.");
      queueQuery.refetch();
      return;
    }
    setMessage("Something went wrong. Please try again.");
  }

  function handleAccept(request: TransferRequest) {
    setPendingId(request.id);
    setMessage(null);
    decision.mutate(
      { id: request.id, payload: { decision: "accept" } },
      {
        onSuccess: () => {
          setPendingId(null);
          setMessage("Request approved.");
        },
        onError,
      }
    );
  }

  function handleReject(
    request: TransferRequest,
    reasonCode: ReceivingManagerRejectReasonCode,
    reasonDetail: string
  ) {
    setPendingId(request.id);
    setMessage(null);
    decision.mutate(
      { id: request.id, payload: { decision: "reject", reasonCode, reasonDetail: reasonDetail || undefined } },
      {
        // The two reject outcomes return the same 200 shape, distinguished only by
        // the resulting status — branch the confirmation message on it (AC7).
        onSuccess: (updated) => {
          setPendingId(null);
          setMessage(
            updated.status === "Hold"
              ? "No other candidate manager remains — this request is now on hold."
              : "Sent back to Receiving HR to pick another candidate manager."
          );
        },
        onError,
      }
    );
  }

  return (
    <QueueSection
      title="Receiving Manager"
      isEmpty={requests.length === 0}
      emptyMessage="No requests waiting on your approval."
      message={message}
    >
      {requests.map((request) => {
        const display = describe(request);
        const submitting = pendingId === request.id && decision.isPending;
        return (
          <QueueCard key={request.id}>
            <QueueItemSummary {...display} effectiveDate={request.effectiveDate} escalated={request.escalated} />
            <div className="flex items-center gap-2">
              <Button type="button" loading={submitting} onClick={() => handleAccept(request)}>
                Accept
              </Button>
              <ReasonCodeDialog
                submitting={submitting}
                onConfirm={(reasonCode, reasonDetail) => handleReject(request, reasonCode, reasonDetail)}
              />
            </div>
          </QueueCard>
        );
      })}
    </QueueSection>
  );
}
