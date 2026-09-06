"use client";

import { useState } from "react";
import { useAuthStore } from "@/features/auth/auth.store";
import {
  useReceivingHrGateQueue,
  useReceivingHrReassignmentQueue,
} from "@/features/transfer-request/transfer-request.queries";
import { useReassignManager, useReceivingHrGateDecision } from "@/features/transfer-request/transfer-request.mutations";
import { useTransferRequestDisplay } from "@/screens/approvals/useTransferRequestDisplay";
import { QueueCard, QueueSection } from "@/screens/approvals/components/QueueSection";
import { QueueItemSummary } from "@/screens/approvals/components/QueueItemSummary";
import { RejectReasonDialog } from "@/components/ui/RejectReasonDialog";
import { ManagerPicker } from "@/components/ui/ManagerPicker";
import { Button } from "@/components/ui/Button";
import { apiErrorCode, apiStatus } from "@/lib/apiError";
import type { TransferRequest } from "@/types/transferRequest";

export function ReceivingHrGateQueue() {
  const roleCategory = useAuthStore((state) => state.employee?.roleCategory ?? null);
  if (roleCategory !== "HR") return null;

  return (
    <>
      <GateQueueSection />
      <ReassignmentQueueSection />
    </>
  );
}

function GateQueueSection() {
  const queueQuery = useReceivingHrGateQueue();
  const decision = useReceivingHrGateDecision();
  const { describe } = useTransferRequestDisplay(queueQuery.data ?? []);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [managerByRequest, setManagerByRequest] = useState<Record<string, string>>({});
  const [managerError, setManagerError] = useState<Record<string, string>>({});
  const [message, setMessage] = useState<string | null>(null);

  if (queueQuery.isLoading || !queueQuery.data) return null;
  const requests = queueQuery.data;

  function handleAccept(request: TransferRequest) {
    const assignedManagerId = managerByRequest[request.id];
    if (!assignedManagerId) {
      setManagerError((prev) => ({ ...prev, [request.id]: "Select a manager before accepting." }));
      return;
    }
    setManagerError((prev) => ({ ...prev, [request.id]: "" }));
    setPendingId(request.id);
    setMessage(null);
    decision.mutate(
      { id: request.id, payload: { decision: "accept", assignedManagerId } },
      {
        onSuccess: () => {
          setPendingId(null);
          setMessage("Accepted — the employee's organisational record has been updated.");
        },
        onError: (error) => {
          setPendingId(null);
          const code = apiErrorCode(error);
          const status = apiStatus(error);
          if (code === "INVALID_MANAGER_ROLE") {
            setManagerError((prev) => ({
              ...prev,
              [request.id]: "This person isn't a valid Manager for that Department+Location.",
            }));
            return;
          }
          if (code === "INVALID_STATUS_TRANSITION") {
            setMessage("This request has moved on already — your queue has been refreshed.");
            queueQuery.refetch();
            return;
          }
          if (status === 403) {
            setMessage("Something went wrong. Your queue has been refreshed.");
            queueQuery.refetch();
            return;
          }
          setMessage("Something went wrong. Please try again.");
        },
      }
    );
  }

  function handleReject(request: TransferRequest, reason: string) {
    setPendingId(request.id);
    setMessage(null);
    decision.mutate(
      { id: request.id, payload: { decision: "reject", reason: reason || undefined } },
      {
        onSuccess: () => {
          setPendingId(null);
          setMessage("Request rejected.");
        },
        onError: (error) => {
          setPendingId(null);
          const code = apiErrorCode(error);
          if (code === "INVALID_STATUS_TRANSITION") {
            setMessage("This request has moved on already — your queue has been refreshed.");
            queueQuery.refetch();
            return;
          }
          setMessage("Something went wrong. Please try again.");
        },
      }
    );
  }

  return (
    <QueueSection
      title="Receiving HR — Approval Gate"
      isEmpty={requests.length === 0}
      emptyMessage="No requests waiting on your decision."
      message={message}
    >
      {requests.map((request) => {
        const display = describe(request);
        const submitting = pendingId === request.id && decision.isPending;
        return (
          <QueueCard key={request.id}>
            <QueueItemSummary {...display} effectiveDate={request.effectiveDate} escalated={request.escalated} />
            <ManagerPicker
              locationId={request.newLocationId}
              departmentId={request.newDepartmentId}
              value={managerByRequest[request.id] ?? ""}
              onChange={(value) => setManagerByRequest((prev) => ({ ...prev, [request.id]: value }))}
              error={managerError[request.id]}
            />
            <div className="flex items-center gap-2">
              <Button type="button" loading={submitting} onClick={() => handleAccept(request)}>
                Accept
              </Button>
              <RejectReasonDialog
                submitting={submitting}
                reasonRequired={false}
                onConfirm={(reason) => handleReject(request, reason)}
              />
            </div>
          </QueueCard>
        );
      })}
    </QueueSection>
  );
}

function ReassignmentQueueSection() {
  const queueQuery = useReceivingHrReassignmentQueue();
  const reassign = useReassignManager();
  const { describe } = useTransferRequestDisplay(queueQuery.data ?? []);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [managerByRequest, setManagerByRequest] = useState<Record<string, string>>({});
  const [managerError, setManagerError] = useState<Record<string, string>>({});
  const [message, setMessage] = useState<string | null>(null);

  if (queueQuery.isLoading || !queueQuery.data) return null;
  const requests = queueQuery.data;

  function handleReassign(request: TransferRequest) {
    const assignedManagerId = managerByRequest[request.id];
    if (!assignedManagerId) {
      setManagerError((prev) => ({ ...prev, [request.id]: "Select a manager before reassigning." }));
      return;
    }
    setManagerError((prev) => ({ ...prev, [request.id]: "" }));
    setPendingId(request.id);
    setMessage(null);
    reassign.mutate(
      { id: request.id, assignedManagerId },
      {
        onSuccess: () => {
          setPendingId(null);
          setMessage("Reassigned to the new candidate manager.");
        },
        onError: (error) => {
          setPendingId(null);
          const code = apiErrorCode(error);
          if (code === "INVALID_MANAGER_ROLE") {
            setManagerError((prev) => ({
              ...prev,
              [request.id]: "This person isn't a valid Manager for that Department+Location.",
            }));
            return;
          }
          setMessage("Something went wrong. Please try again.");
          queueQuery.refetch();
        },
      }
    );
  }

  return (
    <QueueSection
      title="Receiving HR — Reassignment Needed"
      isEmpty={requests.length === 0}
      emptyMessage="No requests waiting on a new candidate manager."
      message={message}
    >
      {requests.map((request) => {
        const display = describe(request);
        const submitting = pendingId === request.id && reassign.isPending;
        return (
          <QueueCard key={request.id}>
            <QueueItemSummary {...display} effectiveDate={request.effectiveDate} escalated={request.escalated} />
            <ManagerPicker
              locationId={request.newLocationId}
              departmentId={request.newDepartmentId}
              value={managerByRequest[request.id] ?? ""}
              onChange={(value) => setManagerByRequest((prev) => ({ ...prev, [request.id]: value }))}
              error={managerError[request.id]}
            />
            <Button type="button" loading={submitting} onClick={() => handleReassign(request)}>
              Reassign Manager
            </Button>
          </QueueCard>
        );
      })}
    </QueueSection>
  );
}
