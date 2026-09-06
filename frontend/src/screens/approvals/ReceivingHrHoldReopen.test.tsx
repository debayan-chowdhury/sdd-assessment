import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ReceivingHrHoldReopen } from "@/screens/approvals/ReceivingHrHoldReopen";

const useReceivingHrHoldQueue = vi.fn();
const useAuthStoreState = vi.fn();
const mutate = vi.fn();
const refetch = vi.fn();

vi.mock("@/features/auth/auth.store", () => ({
  useAuthStore: (selector: (state: unknown) => unknown) => selector(useAuthStoreState()),
}));

vi.mock("@/features/transfer-request/transfer-request.queries", () => ({
  useReceivingHrHoldQueue: () => useReceivingHrHoldQueue(),
  useCandidateManagers: () => ({ data: [{ id: "mgr-1", name: "Alex Manager" }], isLoading: false }),
  useEmployeeNames: () => ({ data: [{ id: "emp-1", name: "Jamie Employee" }], isLoading: false }),
  useLocationOptions: () => ({ data: [{ id: "loc-1", name: "Delhi" }], isLoading: false }),
  useAllDepartmentOptions: () => ({ data: [{ id: "dept-1", name: "Finance" }], isLoading: false }),
  useRoleOptions: () => ({ data: [{ id: "role-1", name: "Analyst" }], isLoading: false }),
}));

vi.mock("@/features/transfer-request/transfer-request.mutations", () => ({
  useReopenHold: () => ({ mutate, isPending: false }),
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
    holdReason: "All candidate managers rejected.",
    ...overrides,
  };
}

describe("ReceivingHrHoldReopen", () => {
  beforeEach(() => {
    mutate.mockReset();
    refetch.mockReset();
    useAuthStoreState.mockReturnValue({ employee: { roleCategory: "HR" } });
  });

  it("is not rendered for any roleCategory other than HR", () => {
    useAuthStoreState.mockReturnValue({ employee: { roleCategory: "IT" } });
    useReceivingHrHoldQueue.mockReturnValue({ data: [makeRequest()], isLoading: false, refetch });

    const { container } = render(<ReceivingHrHoldReopen />);

    expect(container).toBeEmptyDOMElement();
  });

  it("AC13 — reopening within the window succeeds and moves the request to the active queue", async () => {
    useReceivingHrHoldQueue.mockReturnValue({ data: [makeRequest()], isLoading: false, refetch });
    mutate.mockImplementation((_vars, { onSuccess }) => onSuccess());
    const user = userEvent.setup();

    render(<ReceivingHrHoldReopen />);
    await user.selectOptions(screen.getByLabelText("Receiving Manager"), "mgr-1");
    await user.click(screen.getByRole("button", { name: "Reopen" }));

    expect(mutate).toHaveBeenCalledWith({ id: "tr-1", assignedManagerId: "mgr-1" }, expect.any(Object));
    expect(screen.getByText(/back in the active queue/)).toBeInTheDocument();
  });

  it("AC14 — 409 HOLD_WINDOW_EXPIRED explains and hides further reopen for that request", async () => {
    useReceivingHrHoldQueue.mockReturnValue({ data: [makeRequest()], isLoading: false, refetch });
    mutate.mockImplementation((_vars, { onError }) =>
      onError({ isAxiosError: true, response: { status: 409, data: { error: { code: "HOLD_WINDOW_EXPIRED" } } } })
    );
    const user = userEvent.setup();

    render(<ReceivingHrHoldReopen />);
    await user.selectOptions(screen.getByLabelText("Receiving Manager"), "mgr-1");
    await user.click(screen.getByRole("button", { name: "Reopen" }));

    expect(await screen.findByText(/6-month hold window has passed/)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Reopen" })).not.toBeInTheDocument();
    expect(screen.getByText(/no further reopen action is available/)).toBeInTheDocument();
  });

  it("blocks reopening with no manager selected", async () => {
    useReceivingHrHoldQueue.mockReturnValue({ data: [makeRequest()], isLoading: false, refetch });
    const user = userEvent.setup();

    render(<ReceivingHrHoldReopen />);
    await user.click(screen.getByRole("button", { name: "Reopen" }));

    expect(screen.getByText("Select a manager before reopening.")).toBeInTheDocument();
    expect(mutate).not.toHaveBeenCalled();
  });

  it("shows an explicit empty state", () => {
    useReceivingHrHoldQueue.mockReturnValue({ data: [], isLoading: false, refetch });

    render(<ReceivingHrHoldReopen />);

    expect(screen.getByText("No requests currently on hold.")).toBeInTheDocument();
  });
});
