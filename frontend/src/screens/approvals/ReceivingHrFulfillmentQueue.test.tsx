import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ReceivingHrFulfillmentQueue } from "@/screens/approvals/ReceivingHrFulfillmentQueue";

const useReceivingHrFulfillmentQueue = vi.fn();
const useAuthStoreState = vi.fn();
const triggerMutate = vi.fn();
const confirmMutate = vi.fn();
const refetch = vi.fn();

vi.mock("@/features/auth/auth.store", () => ({
  useAuthStore: (selector: (state: unknown) => unknown) => selector(useAuthStoreState()),
}));

vi.mock("@/features/transfer-request/transfer-request.queries", () => ({
  useReceivingHrFulfillmentQueue: () => useReceivingHrFulfillmentQueue(),
  useEmployeeNames: () => ({ data: [{ id: "emp-1", name: "Jamie Employee" }], isLoading: false }),
  useLocationOptions: () => ({ data: [{ id: "loc-1", name: "Delhi" }], isLoading: false }),
  useAllDepartmentOptions: () => ({ data: [{ id: "dept-1", name: "Finance" }], isLoading: false }),
  useRoleOptions: () => ({ data: [{ id: "role-1", name: "Analyst" }], isLoading: false }),
}));

vi.mock("@/features/transfer-request/transfer-request.mutations", () => ({
  useTriggerFulfillment: () => ({ mutate: triggerMutate, isPending: false }),
  useConfirmCompletion: () => ({ mutate: confirmMutate, isPending: false }),
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
    status: "Pending Fulfillment",
    payrollStatus: "Pending",
    itStatus: "Pending",
    facilitiesStatus: "Not Applicable",
    ...overrides,
  };
}

describe("ReceivingHrFulfillmentQueue", () => {
  beforeEach(() => {
    triggerMutate.mockReset();
    confirmMutate.mockReset();
    refetch.mockReset();
    useAuthStoreState.mockReturnValue({ employee: { roleCategory: "HR" } });
  });

  it("is not rendered for any roleCategory other than HR", () => {
    useAuthStoreState.mockReturnValue({ employee: { roleCategory: "Payroll" } });
    useReceivingHrFulfillmentQueue.mockReturnValue({ data: [makeRequest()], isLoading: false, refetch });

    const { container } = render(<ReceivingHrFulfillmentQueue />);

    expect(container).toBeEmptyDOMElement();
  });

  it("AC6 — renders sub-statuses including Not Applicable, none hidden", () => {
    useReceivingHrFulfillmentQueue.mockReturnValue({ data: [makeRequest()], isLoading: false, refetch });

    render(<ReceivingHrFulfillmentQueue />);

    expect(screen.getByText("Payroll:")).toBeInTheDocument();
    expect(screen.getByText("Facilities:")).toBeInTheDocument();
    expect(screen.getByText("Not Applicable")).toBeInTheDocument();
  });

  it("AC7 — Trigger Fulfillment is offered when Pending Fulfillment Trigger, and calls the API", async () => {
    useReceivingHrFulfillmentQueue.mockReturnValue({
      data: [makeRequest({ status: "Pending Fulfillment Trigger", payrollStatus: null, itStatus: null, facilitiesStatus: null })],
      isLoading: false,
      refetch,
    });
    triggerMutate.mockImplementation((_id, { onSuccess }) => onSuccess());
    const user = userEvent.setup();

    render(<ReceivingHrFulfillmentQueue />);
    await user.click(screen.getByRole("button", { name: "Trigger Fulfillment" }));

    expect(triggerMutate).toHaveBeenCalledWith("tr-1", expect.any(Object));
    expect(screen.getByText("Fulfillment triggered.")).toBeInTheDocument();
  });

  it("AC10 — Confirm Completion succeeds when every applicable sub-status is Done", async () => {
    useReceivingHrFulfillmentQueue.mockReturnValue({
      data: [makeRequest({ payrollStatus: "Done", itStatus: "Done", facilitiesStatus: "Not Applicable" })],
      isLoading: false,
      refetch,
    });
    confirmMutate.mockImplementation((_id, { onSuccess }) => onSuccess());
    const user = userEvent.setup();

    render(<ReceivingHrFulfillmentQueue />);
    const confirmButton = screen.getByRole("button", { name: "Confirm Completion" });
    expect(confirmButton).toBeEnabled();

    await user.click(confirmButton);

    expect(confirmMutate).toHaveBeenCalledWith("tr-1", expect.any(Object));
    expect(screen.getByText("Completion confirmed.")).toBeInTheDocument();
  });

  it("AC11 — Confirm Completion is disabled client-side while an applicable sub-status is not Done", () => {
    useReceivingHrFulfillmentQueue.mockReturnValue({
      data: [makeRequest({ payrollStatus: "Pending", itStatus: "Done", facilitiesStatus: "Not Applicable" })],
      isLoading: false,
      refetch,
    });

    render(<ReceivingHrFulfillmentQueue />);

    expect(screen.getByRole("button", { name: "Confirm Completion" })).toBeDisabled();
  });
});
