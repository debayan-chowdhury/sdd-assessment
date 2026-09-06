import { api } from "@/lib/axios";
import type {
  CurrentHrQueueItem,
  ReceivingManagerRejectReasonCode,
  TransferRequest,
} from "@/types/transferRequest";

export type OptionRecord = { id: string; name: string };

type RawOptionRecord = { _id: string; name: string };

function toOptionRecords(raw: RawOptionRecord[]): OptionRecord[] {
  return raw.map(({ _id, name }) => ({ id: _id, name }));
}

export function fetchLocationOptions() {
  return api.get<RawOptionRecord[]>("/options/locations").then((res) => toOptionRecords(res.data));
}

export function fetchDepartmentOptions(locationId: string) {
  return api
    .get<RawOptionRecord[]>("/options/departments", { params: { locationId } })
    .then((res) => toOptionRecords(res.data));
}

// Every active Department, unfiltered — used to resolve an arbitrary
// TransferRequest's target/current department id to a display name, where
// the location-scoped qualifying-staffing filter of fetchDepartmentOptions
// would wrongly hide one.
export function fetchAllDepartmentOptions() {
  return api.get<RawOptionRecord[]>("/options/departments").then((res) => toOptionRecords(res.data));
}

export function fetchRoleOptions() {
  return api.get<RawOptionRecord[]>("/options/roles").then((res) => toOptionRecords(res.data));
}

// Bounded, id-list name resolution (not a full roster) — see
// backend options.controller.js#listEmployeesByIds.
export function fetchEmployeeNames(ids: string[]) {
  if (ids.length === 0) return Promise.resolve<OptionRecord[]>([]);
  return api
    .get<RawOptionRecord[]>("/options/employees", { params: { ids: ids.join(",") } })
    .then((res) => toOptionRecords(res.data));
}

export function fetchCandidateManagers(locationId: string, departmentId: string) {
  return api
    .get<RawOptionRecord[]>("/options/managers", { params: { locationId, departmentId } })
    .then((res) => toOptionRecords(res.data));
}

export type SubmitTransferRequestPayload = {
  newLocationId: string;
  newDepartmentId: string;
  newRoleId: string;
  effectiveDate: string;
  reason?: string;
};

export function submitTransferRequest(payload: SubmitTransferRequestPayload) {
  return api.post<TransferRequest>("/transfer-requests", payload).then((res) => res.data);
}

export function fetchMyTransferRequests() {
  return api.get<TransferRequest[]>("/transfer-requests/me").then((res) => res.data);
}

export function fetchTransferRequest(id: string) {
  return api.get<TransferRequest>(`/transfer-requests/${id}`).then((res) => res.data);
}

// --- Current Manager ---

export function fetchCurrentManagerQueue() {
  return api.get<TransferRequest[]>("/transfer-requests/pending/current-manager").then((res) => res.data);
}

export type SimpleDecisionPayload = { decision: "accept" | "reject"; reason?: string };

export function decideCurrentManager(id: string, payload: SimpleDecisionPayload) {
  return api.post<TransferRequest>(`/transfer-requests/${id}/current-manager-decision`, payload).then((res) => res.data);
}

// --- Current HR ---

export function fetchCurrentHrQueue() {
  return api.get<CurrentHrQueueItem[]>("/transfer-requests/pending/current-hr").then((res) => res.data);
}

export function decideCurrentHr(id: string, payload: SimpleDecisionPayload) {
  return api.post<TransferRequest>(`/transfer-requests/${id}/current-hr-decision`, payload).then((res) => res.data);
}

// --- Receiving HR: approval gate ---

export function fetchReceivingHrGateQueue() {
  return api.get<TransferRequest[]>("/transfer-requests/pending/receiving-hr-gate").then((res) => res.data);
}

export type ReceivingHrGateDecisionPayload =
  | { decision: "accept"; assignedManagerId: string }
  | { decision: "reject"; reason?: string };

export function decideReceivingHrGate(id: string, payload: ReceivingHrGateDecisionPayload) {
  return api
    .post<TransferRequest>(`/transfer-requests/${id}/receiving-hr-gate-decision`, payload)
    .then((res) => res.data);
}

// --- Receiving HR: reassignment (after a Receiving Manager reject) ---

export function fetchReceivingHrReassignmentQueue() {
  return api.get<TransferRequest[]>("/transfer-requests/pending/receiving-hr-reassignment").then((res) => res.data);
}

export function reassignManager(id: string, assignedManagerId: string) {
  return api
    .post<TransferRequest>(`/transfer-requests/${id}/reassign-manager`, { assignedManagerId })
    .then((res) => res.data);
}

// --- Receiving HR: fulfillment ---

export function fetchReceivingHrFulfillmentQueue() {
  return api.get<TransferRequest[]>("/transfer-requests/pending/receiving-hr-fulfillment").then((res) => res.data);
}

export function triggerFulfillment(id: string) {
  return api.post<TransferRequest>(`/transfer-requests/${id}/trigger-fulfillment`).then((res) => res.data);
}

export function confirmCompletion(id: string) {
  return api.post<TransferRequest>(`/transfer-requests/${id}/confirm-completion`).then((res) => res.data);
}

// --- Receiving HR: hold reopen ---

export function fetchReceivingHrHoldQueue() {
  return api.get<TransferRequest[]>("/transfer-requests/pending/receiving-hr-hold").then((res) => res.data);
}

export function reopenHold(id: string, assignedManagerId: string) {
  return api.post<TransferRequest>(`/transfer-requests/${id}/reopen-hold`, { assignedManagerId }).then((res) => res.data);
}

// --- Receiving Manager ---

export function fetchReceivingManagerQueue() {
  return api.get<TransferRequest[]>("/transfer-requests/pending/receiving-manager").then((res) => res.data);
}

export type ReceivingManagerDecisionPayload =
  | { decision: "accept" }
  | { decision: "reject"; reasonCode: ReceivingManagerRejectReasonCode; reasonDetail?: string };

export function decideReceivingManager(id: string, payload: ReceivingManagerDecisionPayload) {
  return api
    .post<TransferRequest>(`/transfer-requests/${id}/receiving-manager-decision`, payload)
    .then((res) => res.data);
}

// --- Fulfillment worklists: Payroll / IT / Facilities ---

export type FulfillmentStatusPayload = { status: "Done" };

export function fetchPayrollWorklist() {
  return api.get<TransferRequest[]>("/transfer-requests/pending/payroll").then((res) => res.data);
}

export function updatePayrollStatus(id: string, payload: FulfillmentStatusPayload) {
  return api.post<TransferRequest>(`/transfer-requests/${id}/payroll-status`, payload).then((res) => res.data);
}

export function fetchItWorklist() {
  return api.get<TransferRequest[]>("/transfer-requests/pending/it").then((res) => res.data);
}

export function updateItStatus(id: string, payload: FulfillmentStatusPayload) {
  return api.post<TransferRequest>(`/transfer-requests/${id}/it-status`, payload).then((res) => res.data);
}

export function fetchFacilitiesWorklist() {
  return api.get<TransferRequest[]>("/transfer-requests/pending/facilities").then((res) => res.data);
}

export function updateFacilitiesStatus(id: string, payload: FulfillmentStatusPayload) {
  return api.post<TransferRequest>(`/transfer-requests/${id}/facilities-status`, payload).then((res) => res.data);
}
