import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { QueryKey } from "@tanstack/react-query";
import {
  confirmCompletion,
  decideCurrentHr,
  decideCurrentManager,
  decideReceivingHrGate,
  decideReceivingManager,
  reassignManager,
  reopenHold,
  submitTransferRequest,
  triggerFulfillment,
  updateFacilitiesStatus,
  updateItStatus,
  updatePayrollStatus,
  type FulfillmentStatusPayload,
  type ReceivingHrGateDecisionPayload,
  type ReceivingManagerDecisionPayload,
  type SimpleDecisionPayload,
} from "@/features/transfer-request/transfer-request.api";
import { transferRequestKeys } from "@/features/transfer-request/transfer-request.queries";
import type { TransferRequest } from "@/types/transferRequest";

export function useSubmitTransferRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: submitTransferRequest,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: transferRequestKeys.mine });
    },
  });
}

function useQueueMutation<TPayload, TResult = TransferRequest>(
  mutationFn: (id: string, payload: TPayload) => Promise<TResult>,
  ...queueKeys: QueryKey[]
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: TPayload }) => mutationFn(id, payload),
    onSuccess: () => {
      queueKeys.forEach((queryKey) => queryClient.invalidateQueries({ queryKey }));
    },
  });
}

export function useCurrentManagerDecision() {
  return useQueueMutation<SimpleDecisionPayload>(decideCurrentManager, transferRequestKeys.currentManagerQueue);
}

export function useCurrentHrDecision() {
  return useQueueMutation<SimpleDecisionPayload>(decideCurrentHr, transferRequestKeys.currentHrQueue);
}

export function useReceivingHrGateDecision() {
  return useQueueMutation<ReceivingHrGateDecisionPayload>(
    decideReceivingHrGate,
    transferRequestKeys.receivingHrGateQueue
  );
}

export function useReassignManager() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, assignedManagerId }: { id: string; assignedManagerId: string }) =>
      reassignManager(id, assignedManagerId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: transferRequestKeys.receivingHrReassignmentQueue });
    },
  });
}

export function useTriggerFulfillment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => triggerFulfillment(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: transferRequestKeys.receivingHrFulfillmentQueue });
    },
  });
}

export function useConfirmCompletion() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => confirmCompletion(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: transferRequestKeys.receivingHrFulfillmentQueue });
    },
  });
}

export function useReopenHold() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, assignedManagerId }: { id: string; assignedManagerId: string }) =>
      reopenHold(id, assignedManagerId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: transferRequestKeys.receivingHrHoldQueue });
    },
  });
}

export function useReceivingManagerDecision() {
  return useQueueMutation<ReceivingManagerDecisionPayload>(
    decideReceivingManager,
    transferRequestKeys.receivingManagerQueue
  );
}

export function usePayrollStatusUpdate() {
  return useQueueMutation<FulfillmentStatusPayload>(updatePayrollStatus, transferRequestKeys.payrollWorklist);
}

export function useItStatusUpdate() {
  return useQueueMutation<FulfillmentStatusPayload>(updateItStatus, transferRequestKeys.itWorklist);
}

export function useFacilitiesStatusUpdate() {
  return useQueueMutation<FulfillmentStatusPayload>(updateFacilitiesStatus, transferRequestKeys.facilitiesWorklist);
}
