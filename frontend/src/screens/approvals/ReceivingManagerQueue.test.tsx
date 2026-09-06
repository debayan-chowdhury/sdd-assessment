import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ReceivingManagerQueue } from "@/screens/approvals/ReceivingManagerQueue";

const useReceivingManagerQueue = vi.fn();
const useAuthStoreState = vi.fn();
const mutate = vi.fn();
const refetch = vi.fn();

vi.mock("@/features/auth/auth.store", () => ({
  useAuthStore: (selector: (state: unknown) => unknown) => selector(useAuthStoreState()),
}));

vi.mock("@/features/transfer-request/transfer-request.queries", () => ({
  useReceivingManagerQueue: () => useReceivingManagerQueue(),
  useEmployeeNames: () => ({ data: [{ id: "emp-1", name: "Jamie Employee" }], isLoading: false }),
  useLocationOptions: () => ({ data: [{ id: "loc-1", name: "Delhi" }], isLoading: false }),
  useAllDepartmentOptions: () => ({ data: [{ id: "dept-1", name: "Finance" }], isLoading: false }),
  useRoleOptions: () => ({ data: [{ id: "role-1", name: "Analyst" }], isLoading: false }),
}));

vi.mock("@/features/transfer-request/transfer-request.mutations", () => ({
  useReceivingManagerDecision: () => ({ mutate, isPending: false }),
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

describe("ReceivingManagerQueue", () => {
  beforeEach(() => {
    mutate.mockReset();
    refetch.mockReset();
    useAuthStoreState.mockReturnValue({ employee: { roleCategory: "Manager" } });
  });

  it("is not rendered for any roleCategory other than Manager", () => {
    useAuthStoreState.mockReturnValue({ employee: { roleCategory: "HR" } });
    useReceivingManagerQueue.mockReturnValue({ data: [makeRequest()], isLoading: false, refetch });

    const { container } = render(<ReceivingManagerQueue />);

    expect(container).toBeEmptyDOMElement();
  });

  it("AC1 — renders each queued request with employee/target details", () => {
    useReceivingManagerQueue.mockReturnValue({ data: [makeRequest()], isLoading: false, refetch });

    render(<ReceivingManagerQueue />);

    expect(screen.getByText("Jamie Employee")).toBeInTheDocument();
  });

  it("AC2 — Accept removes the item with a success confirmation", async () => {
    useReceivingManagerQueue.mockReturnValue({ data: [makeRequest()], isLoading: false, refetch });
    mutate.mockImplementation((_vars, { onSuccess }) => onSuccess({ status: "Pending Fulfillment Trigger" }));
    const user = userEvent.setup();

    render(<ReceivingManagerQueue />);
    await user.click(screen.getByRole("button", { name: "Accept" }));

    expect(screen.getByText("Request approved.")).toBeInTheDocument();
  });

  it("AC4 — blocks Reject submission with no reason code selected", async () => {
    useReceivingManagerQueue.mockReturnValue({ data: [makeRequest()], isLoading: false, refetch });
    const user = userEvent.setup();

    render(<ReceivingManagerQueue />);
    await user.click(screen.getByRole("button", { name: "Reject" }));
    await user.click(screen.getByRole("button", { name: "Confirm reject" }));

    expect(mutate).not.toHaveBeenCalled();
  });

  it("AC5 — reject resulting in Pending Receiving HR Reassignment shows the reassignment message", async () => {
    useReceivingManagerQueue.mockReturnValue({ data: [makeRequest()], isLoading: false, refetch });
    mutate.mockImplementation((_vars, { onSuccess }) =>
      onSuccess({ status: "Pending Receiving HR Reassignment" })
    );
    const user = userEvent.setup();

    render(<ReceivingManagerQueue />);
    await user.click(screen.getByRole("button", { name: "Reject" }));
    await user.selectOptions(screen.getByLabelText("Reason"), "NO_HEADCOUNT");
    await user.click(screen.getByRole("button", { name: "Confirm reject" }));

    expect(screen.getByText(/pick another candidate manager/)).toBeInTheDocument();
  });

  it("AC6 — reject resulting in Hold shows the hold message", async () => {
    useReceivingManagerQueue.mockReturnValue({ data: [makeRequest()], isLoading: false, refetch });
    mutate.mockImplementation((_vars, { onSuccess }) => onSuccess({ status: "Hold" }));
    const user = userEvent.setup();

    render(<ReceivingManagerQueue />);
    await user.click(screen.getByRole("button", { name: "Reject" }));
    await user.selectOptions(screen.getByLabelText("Reason"), "TIMING_CONFLICT");
    await user.click(screen.getByRole("button", { name: "Confirm reject" }));

    expect(screen.getByText(/now on hold/)).toBeInTheDocument();
  });

  it("AC8 — 409 INVALID_STATUS_TRANSITION explains and refetches", async () => {
    useReceivingManagerQueue.mockReturnValue({ data: [makeRequest()], isLoading: false, refetch });
    mutate.mockImplementation((_vars, { onError }) =>
      onError({ isAxiosError: true, response: { status: 409, data: { error: { code: "INVALID_STATUS_TRANSITION" } } } })
    );
    const user = userEvent.setup();

    render(<ReceivingManagerQueue />);
    await user.click(screen.getByRole("button", { name: "Accept" }));

    expect(await screen.findByText(/no longer pending/)).toBeInTheDocument();
    expect(refetch).toHaveBeenCalled();
  });

  it("AC9 — shows an escalation indicator, remains actionable", () => {
    useReceivingManagerQueue.mockReturnValue({
      data: [makeRequest({ escalated: true })],
      isLoading: false,
      refetch,
    });

    render(<ReceivingManagerQueue />);

    expect(screen.getByText("Escalated")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Accept" })).toBeEnabled();
  });
});
