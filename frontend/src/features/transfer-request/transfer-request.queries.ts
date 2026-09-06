import { useQuery } from "@tanstack/react-query";
import {
  fetchAllDepartmentOptions,
  fetchCandidateManagers,
  fetchCurrentHrQueue,
  fetchCurrentManagerQueue,
  fetchDepartmentOptions,
  fetchEmployeeNames,
  fetchFacilitiesWorklist,
  fetchItWorklist,
  fetchLocationOptions,
  fetchMyTransferRequests,
  fetchPayrollWorklist,
  fetchReceivingHrFulfillmentQueue,
  fetchReceivingHrGateQueue,
  fetchReceivingHrHoldQueue,
  fetchReceivingHrReassignmentQueue,
  fetchReceivingManagerQueue,
  fetchRoleOptions,
  fetchTransferRequest,
} from "@/features/transfer-request/transfer-request.api";

export const transferRequestKeys = {
  mine: ["transfer-requests", "me"] as const,
  detail: (id: string) => ["transfer-requests", id] as const,
  locationOptions: ["transfer-requests", "options", "locations"] as const,
  departmentOptions: (locationId: string) => ["transfer-requests", "options", "departments", locationId] as const,
  allDepartmentOptions: ["transfer-requests", "options", "departments", "all"] as const,
  roleOptions: ["transfer-requests", "options", "roles"] as const,
  employeeNames: (ids: string[]) => ["transfer-requests", "options", "employees", ...[...ids].sort()] as const,
  candidateManagers: (locationId: string, departmentId: string) =>
    ["transfer-requests", "options", "managers", locationId, departmentId] as const,
  currentManagerQueue: ["transfer-requests", "queue", "current-manager"] as const,
  currentHrQueue: ["transfer-requests", "queue", "current-hr"] as const,
  receivingHrGateQueue: ["transfer-requests", "queue", "receiving-hr-gate"] as const,
  receivingHrReassignmentQueue: ["transfer-requests", "queue", "receiving-hr-reassignment"] as const,
  receivingHrFulfillmentQueue: ["transfer-requests", "queue", "receiving-hr-fulfillment"] as const,
  receivingHrHoldQueue: ["transfer-requests", "queue", "receiving-hr-hold"] as const,
  receivingManagerQueue: ["transfer-requests", "queue", "receiving-manager"] as const,
  payrollWorklist: ["transfer-requests", "queue", "payroll"] as const,
  itWorklist: ["transfer-requests", "queue", "it"] as const,
  facilitiesWorklist: ["transfer-requests", "queue", "facilities"] as const,
};

export function useMyTransferRequests() {
  return useQuery({
    queryKey: transferRequestKeys.mine,
    queryFn: fetchMyTransferRequests,
  });
}

export function useTransferRequest(id: string) {
  return useQuery({
    queryKey: transferRequestKeys.detail(id),
    queryFn: () => fetchTransferRequest(id),
    enabled: Boolean(id),
  });
}

export function useLocationOptions() {
  return useQuery({
    queryKey: transferRequestKeys.locationOptions,
    queryFn: fetchLocationOptions,
  });
}

export function useDepartmentOptions(locationId: string) {
  return useQuery({
    queryKey: transferRequestKeys.departmentOptions(locationId),
    queryFn: () => fetchDepartmentOptions(locationId),
    enabled: Boolean(locationId),
  });
}

export function useRoleOptions() {
  return useQuery({
    queryKey: transferRequestKeys.roleOptions,
    queryFn: fetchRoleOptions,
  });
}

export function useAllDepartmentOptions() {
  return useQuery({
    queryKey: transferRequestKeys.allDepartmentOptions,
    queryFn: fetchAllDepartmentOptions,
  });
}

export function useEmployeeNames(ids: string[]) {
  return useQuery({
    queryKey: transferRequestKeys.employeeNames(ids),
    queryFn: () => fetchEmployeeNames(ids),
    enabled: ids.length > 0,
  });
}

export function useCandidateManagers(locationId: string, departmentId: string) {
  return useQuery({
    queryKey: transferRequestKeys.candidateManagers(locationId, departmentId),
    queryFn: () => fetchCandidateManagers(locationId, departmentId),
    enabled: Boolean(locationId && departmentId),
  });
}

// `enabled` defaults to true for direct use (e.g. a screen that already
// knows it's relevant); callers that render regardless of role — the
// Dashboard's queue-count summary, FulfillmentWorklist's wrapper components —
// pass `false` to skip the request entirely rather than let it 403
// (Payroll/IT/Facilities) or fetch data nothing will show.
export function useCurrentManagerQueue(enabled = true) {
  return useQuery({
    queryKey: transferRequestKeys.currentManagerQueue,
    queryFn: fetchCurrentManagerQueue,
    enabled,
  });
}

export function useCurrentHrQueue(enabled = true) {
  return useQuery({
    queryKey: transferRequestKeys.currentHrQueue,
    queryFn: fetchCurrentHrQueue,
    enabled,
  });
}

export function useReceivingHrGateQueue(enabled = true) {
  return useQuery({
    queryKey: transferRequestKeys.receivingHrGateQueue,
    queryFn: fetchReceivingHrGateQueue,
    enabled,
  });
}

export function useReceivingHrReassignmentQueue(enabled = true) {
  return useQuery({
    queryKey: transferRequestKeys.receivingHrReassignmentQueue,
    queryFn: fetchReceivingHrReassignmentQueue,
    enabled,
  });
}

export function useReceivingHrFulfillmentQueue(enabled = true) {
  return useQuery({
    queryKey: transferRequestKeys.receivingHrFulfillmentQueue,
    queryFn: fetchReceivingHrFulfillmentQueue,
    enabled,
  });
}

export function useReceivingHrHoldQueue(enabled = true) {
  return useQuery({
    queryKey: transferRequestKeys.receivingHrHoldQueue,
    queryFn: fetchReceivingHrHoldQueue,
    enabled,
  });
}

export function useReceivingManagerQueue(enabled = true) {
  return useQuery({
    queryKey: transferRequestKeys.receivingManagerQueue,
    queryFn: fetchReceivingManagerQueue,
    enabled,
  });
}

export function usePayrollWorklist(enabled = true) {
  return useQuery({
    queryKey: transferRequestKeys.payrollWorklist,
    queryFn: fetchPayrollWorklist,
    enabled,
  });
}

export function useItWorklist(enabled = true) {
  return useQuery({
    queryKey: transferRequestKeys.itWorklist,
    queryFn: fetchItWorklist,
    enabled,
  });
}

export function useFacilitiesWorklist(enabled = true) {
  return useQuery({
    queryKey: transferRequestKeys.facilitiesWorklist,
    queryFn: fetchFacilitiesWorklist,
    enabled,
  });
}
