import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ReceivingHrGateQueue } from "@/screens/approvals/ReceivingHrGateQueue";

const useReceivingHrGateQueue = vi.fn();
const useReceivingHrReassignmentQueue = vi.fn();
const useAuthStoreState = vi.fn();
const gateMutate = vi.fn();
const reassignMutate = vi.fn();
const gateRefetch = vi.fn();
const reassignRefetch = vi.fn();

vi.mock("@/features/auth/auth.store", () => ({
  useAuthStore: (selector: (state: unknown) => unknown) => selector(useAuthStoreState()),
}));

vi.mock("@/features/transfer-request/transfer-request.queries", () => ({
  useReceivingHrGateQueue: () => useReceivingHrGateQueue(),
  useReceivingHrReassignmentQueue: () => useReceivingHrReassignmentQueue(),
  useCandidateManagers: () => ({ data: [{ id: "mgr-1", name: "Alex Manager" }], isLoading: false }),
  useEmployeeNames: () => ({ data: [{ id: "emp-1", name: "Jamie Employee" }], isLoading: false }),
  useLocationOptions: () => ({ data: [{ id: "loc-1", name: "Delhi" }], isLoading: false }),
  useAllDepartmentOptions: () => ({ data: [{ id: "dept-1", name: "Finance" }], isLoading: false }),
  useRoleOptions: () => ({ data: [{ id: "role-1", name: "Analyst" }], isLoading: false }),
}));

vi.mock("@/features/transfer-request/transfer-request.mutations", () => ({
  useReceivingHrGateDecision: () => ({ mutate: gateMutate, isPending: false }),
  useReassignManager: () => ({ mutate: reassignMutate, isPending: false }),
}));

function makeRequest(overrides = {}) {
  return {
    id: "tr-1",
    employeeId: "emp-1",
    newLocationId: "loc-1",
    newDepartmentId: "dept-1",
    newRoleId: "role-1",
    effectiveDate: "2026-12-01",
    escalated: false,
    ...overrides,
  };
}

describe("ReceivingHrGateQueue", () => {
  beforeEach(() => {
    gateMutate.mockReset();
    reassignMutate.mockReset();
    gateRefetch.mockReset();
    reassignRefetch.mockReset();
    useReceivingHrReassignmentQueue.mockReturnValue({ data: [], isLoading: false, refetch: reassignRefetch });
    useAuthStoreState.mockReturnValue({ employee: { roleCategory: "HR" } });
  });

  it("is not rendered for any roleCategory other than HR", () => {
    useAuthStoreState.mockReturnValue({ employee: { roleCategory: "Manager" } });
    useReceivingHrGateQueue.mockReturnValue({ data: [makeRequest()], isLoading: false, refetch: gateRefetch });

    const { container } = render(<ReceivingHrGateQueue />);

    expect(container).toBeEmptyDOMElement();
  });

  it("AC1 — renders each gate-queue item with employee/target details", () => {
    useReceivingHrGateQueue.mockReturnValue({ data: [makeRequest()], isLoading: false, refetch: gateRefetch });

    render(<ReceivingHrGateQueue />);

    expect(screen.getByText("Jamie Employee")).toBeInTheDocument();
  });

  it("AC2 — blocks Accept with no manager selected", async () => {
    useReceivingHrGateQueue.mockReturnValue({ data: [makeRequest()], isLoading: false, refetch: gateRefetch });
    const user = userEvent.setup();

    render(<ReceivingHrGateQueue />);
    await user.click(screen.getByRole("button", { name: "Accept" }));

    expect(screen.getByText("Select a manager before accepting.")).toBeInTheDocument();
    expect(gateMutate).not.toHaveBeenCalled();
  });

  it("AC3 — Accept with a manager selected succeeds", async () => {
    useReceivingHrGateQueue.mockReturnValue({ data: [makeRequest()], isLoading: false, refetch: gateRefetch });
    gateMutate.mockImplementation((_vars, { onSuccess }) => onSuccess());
    const user = userEvent.setup();

    render(<ReceivingHrGateQueue />);
    await user.selectOptions(screen.getByLabelText("Receiving Manager"), "mgr-1");
    await user.click(screen.getByRole("button", { name: "Accept" }));

    expect(gateMutate).toHaveBeenCalledWith(
      { id: "tr-1", payload: { decision: "accept", assignedManagerId: "mgr-1" } },
      expect.any(Object)
    );
    expect(screen.getByText(/organisational record has been updated/)).toBeInTheDocument();
  });

  it("AC4 — 400 INVALID_MANAGER_ROLE shows an inline error on the manager control", async () => {
    useReceivingHrGateQueue.mockReturnValue({ data: [makeRequest()], isLoading: false, refetch: gateRefetch });
    gateMutate.mockImplementation((_vars, { onError }) =>
      onError({ isAxiosError: true, response: { status: 400, data: { error: { code: "INVALID_MANAGER_ROLE" } } } })
    );
    const user = userEvent.setup();

    render(<ReceivingHrGateQueue />);
    await user.selectOptions(screen.getByLabelText("Receiving Manager"), "mgr-1");
    await user.click(screen.getByRole("button", { name: "Accept" }));

    expect(await screen.findByText(/isn't a valid Manager/)).toBeInTheDocument();
  });

  it("AC5 — Reject with no reason succeeds", async () => {
    useReceivingHrGateQueue.mockReturnValue({ data: [makeRequest()], isLoading: false, refetch: gateRefetch });
    gateMutate.mockImplementation((_vars, { onSuccess }) => onSuccess());
    const user = userEvent.setup();

    render(<ReceivingHrGateQueue />);
    await user.click(screen.getByRole("button", { name: "Reject" }));
    await user.click(screen.getByRole("button", { name: "Confirm reject" }));

    expect(gateMutate).toHaveBeenCalledWith(
      { id: "tr-1", payload: { decision: "reject", reason: undefined } },
      expect.any(Object)
    );
  });

  it("AC12 — the Reassignment Needed section requires a manager before submitting", async () => {
    useReceivingHrGateQueue.mockReturnValue({ data: [], isLoading: false, refetch: gateRefetch });
    useReceivingHrReassignmentQueue.mockReturnValue({
      data: [makeRequest({ id: "tr-2" })],
      isLoading: false,
      refetch: reassignRefetch,
    });
    const user = userEvent.setup();

    render(<ReceivingHrGateQueue />);
    await user.click(screen.getByRole("button", { name: "Reassign Manager" }));

    expect(screen.getByText("Select a manager before reassigning.")).toBeInTheDocument();
    expect(reassignMutate).not.toHaveBeenCalled();
  });

  it("AC17 — shows an escalation indicator on gate items", () => {
    useReceivingHrGateQueue.mockReturnValue({
      data: [makeRequest({ escalated: true })],
      isLoading: false,
      refetch: gateRefetch,
    });

    render(<ReceivingHrGateQueue />);

    expect(screen.getByText("Escalated")).toBeInTheDocument();
  });
});
