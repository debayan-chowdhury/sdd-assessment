import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { CurrentManagerQueue } from "@/screens/approvals/CurrentManagerQueue";

const useCurrentManagerQueue = vi.fn();
const useAuthStoreState = vi.fn();
const mutate = vi.fn();
const refetch = vi.fn();

vi.mock("@/features/auth/auth.store", () => ({
  useAuthStore: (selector: (state: unknown) => unknown) => selector(useAuthStoreState()),
}));

vi.mock("@/features/transfer-request/transfer-request.queries", () => ({
  useCurrentManagerQueue: () => useCurrentManagerQueue(),
  useEmployeeNames: () => ({ data: [{ id: "emp-1", name: "Jamie Employee" }], isLoading: false }),
  useLocationOptions: () => ({ data: [{ id: "loc-1", name: "Delhi" }], isLoading: false }),
  useAllDepartmentOptions: () => ({ data: [{ id: "dept-1", name: "Finance" }], isLoading: false }),
  useRoleOptions: () => ({ data: [{ id: "role-1", name: "Analyst" }], isLoading: false }),
}));

vi.mock("@/features/transfer-request/transfer-request.mutations", () => ({
  useCurrentManagerDecision: () => ({ mutate, isPending: false }),
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

describe("CurrentManagerQueue", () => {
  beforeEach(() => {
    mutate.mockReset();
    refetch.mockReset();
    useAuthStoreState.mockReturnValue({ employee: { roleCategory: "Manager" } });
  });

  it("is not rendered for any roleCategory other than Manager", () => {
    useAuthStoreState.mockReturnValue({ employee: { roleCategory: "HR" } });
    useCurrentManagerQueue.mockReturnValue({ data: [makeRequest()], isLoading: false, refetch });

    const { container } = render(<CurrentManagerQueue />);

    expect(container).toBeEmptyDOMElement();
  });

  it("AC1 — renders each queued request with employee/target/date details", () => {
    useCurrentManagerQueue.mockReturnValue({ data: [makeRequest()], isLoading: false, refetch });

    render(<CurrentManagerQueue />);

    expect(screen.getByText("Jamie Employee")).toBeInTheDocument();
    expect(screen.getByText(/Finance/)).toBeInTheDocument();
    expect(screen.getByText(/Delhi/)).toBeInTheDocument();
    expect(screen.getByText(/Analyst/)).toBeInTheDocument();
    expect(screen.getByText(/2026-12-01/)).toBeInTheDocument();
  });

  it("AC2 — shows an explicit empty state, never a blank gap", () => {
    useCurrentManagerQueue.mockReturnValue({ data: [], isLoading: false, refetch });

    render(<CurrentManagerQueue />);

    expect(screen.getByText("No requests waiting on your approval.")).toBeInTheDocument();
  });

  it("AC3 — Accept removes the item and shows a success confirmation", async () => {
    useCurrentManagerQueue.mockReturnValue({ data: [makeRequest()], isLoading: false, refetch });
    mutate.mockImplementation((_vars, { onSuccess }) => onSuccess());
    const user = userEvent.setup();

    render(<CurrentManagerQueue />);
    await user.click(screen.getByRole("button", { name: "Accept" }));

    expect(mutate).toHaveBeenCalledWith(
      { id: "tr-1", payload: { decision: "accept", reason: undefined } },
      expect.any(Object)
    );
    expect(screen.getByText("Request approved.")).toBeInTheDocument();
  });

  it("AC4 — blocks Reject submission with an empty reason", async () => {
    useCurrentManagerQueue.mockReturnValue({ data: [makeRequest()], isLoading: false, refetch });
    const user = userEvent.setup();

    render(<CurrentManagerQueue />);
    await user.click(screen.getByRole("button", { name: "Reject" }));
    await user.click(screen.getByRole("button", { name: "Confirm reject" }));

    expect(screen.getByText("A reason is required.")).toBeInTheDocument();
    expect(mutate).not.toHaveBeenCalled();
  });

  it("AC5 — submits Reject with a reason and shows a success confirmation", async () => {
    useCurrentManagerQueue.mockReturnValue({ data: [makeRequest()], isLoading: false, refetch });
    mutate.mockImplementation((_vars, { onSuccess }) => onSuccess());
    const user = userEvent.setup();

    render(<CurrentManagerQueue />);
    await user.click(screen.getByRole("button", { name: "Reject" }));
    await user.type(screen.getByLabelText("Reason"), "Not a fit");
    await user.click(screen.getByRole("button", { name: "Confirm reject" }));

    expect(mutate).toHaveBeenCalledWith(
      { id: "tr-1", payload: { decision: "reject", reason: "Not a fit" } },
      expect.any(Object)
    );
    expect(screen.getByText("Request rejected.")).toBeInTheDocument();
  });

  it("AC6 — 409 INVALID_STATUS_TRANSITION explains and refetches the queue", async () => {
    useCurrentManagerQueue.mockReturnValue({ data: [makeRequest()], isLoading: false, refetch });
    mutate.mockImplementation((_vars, { onError }) =>
      onError({ isAxiosError: true, response: { status: 409, data: { error: { code: "INVALID_STATUS_TRANSITION" } } } })
    );
    const user = userEvent.setup();

    render(<CurrentManagerQueue />);
    await user.click(screen.getByRole("button", { name: "Accept" }));

    expect(await screen.findByText(/no longer pending/)).toBeInTheDocument();
    expect(refetch).toHaveBeenCalled();
  });

  it("AC8 — shows an escalation indicator while keeping the item actionable", () => {
    useCurrentManagerQueue.mockReturnValue({ data: [makeRequest({ escalated: true })], isLoading: false, refetch });

    render(<CurrentManagerQueue />);

    expect(screen.getByText("Escalated")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Accept" })).toBeEnabled();
  });
});
