import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { CurrentHrQueue } from "@/screens/approvals/CurrentHrQueue";

const useCurrentHrQueue = vi.fn();
const useAuthStoreState = vi.fn();
const mutate = vi.fn();
const refetch = vi.fn();

vi.mock("@/features/auth/auth.store", () => ({
  useAuthStore: (selector: (state: unknown) => unknown) => selector(useAuthStoreState()),
}));

vi.mock("@/features/transfer-request/transfer-request.queries", () => ({
  useCurrentHrQueue: () => useCurrentHrQueue(),
  useEmployeeNames: () => ({ data: [{ id: "emp-1", name: "Jamie Employee" }], isLoading: false }),
  useLocationOptions: () => ({ data: [{ id: "loc-1", name: "Delhi" }], isLoading: false }),
  useAllDepartmentOptions: () => ({ data: [{ id: "dept-1", name: "Finance" }], isLoading: false }),
  useRoleOptions: () => ({ data: [{ id: "role-1", name: "Analyst" }], isLoading: false }),
}));

vi.mock("@/features/transfer-request/transfer-request.mutations", () => ({
  useCurrentHrDecision: () => ({ mutate, isPending: false }),
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
    employeeTenureDays: 200,
    meetsMinimumTenure: true,
    ...overrides,
  };
}

describe("CurrentHrQueue", () => {
  beforeEach(() => {
    mutate.mockReset();
    refetch.mockReset();
    useAuthStoreState.mockReturnValue({ employee: { roleCategory: "HR" } });
  });

  it("is not rendered for any roleCategory other than HR", () => {
    useAuthStoreState.mockReturnValue({ employee: { roleCategory: "Manager" } });
    useCurrentHrQueue.mockReturnValue({ data: [makeRequest()], isLoading: false, refetch });

    const { container } = render(<CurrentHrQueue />);

    expect(container).toBeEmptyDOMElement();
  });

  it("AC1 — renders tenure and an eligible indicator", () => {
    useCurrentHrQueue.mockReturnValue({ data: [makeRequest()], isLoading: false, refetch });

    render(<CurrentHrQueue />);

    expect(screen.getByText("200 days")).toBeInTheDocument();
    expect(screen.getByText("Meets minimum tenure")).toBeInTheDocument();
  });

  it("AC2 — clicking Accept on an ineligible request surfaces a client-side warning before submit", async () => {
    useCurrentHrQueue.mockReturnValue({
      data: [makeRequest({ meetsMinimumTenure: false, employeeTenureDays: 90 })],
      isLoading: false,
      refetch,
    });
    const user = userEvent.setup();

    render(<CurrentHrQueue />);
    await user.click(screen.getByRole("button", { name: "Accept" }));

    expect(screen.getByText(/does not meet the 6-month minimum tenure/)).toBeInTheDocument();
    expect(mutate).not.toHaveBeenCalled();
  });

  it("AC3 — force-submitting an ineligible Accept surfaces the backend's INELIGIBLE_TENURE error and keeps the item", async () => {
    useCurrentHrQueue.mockReturnValue({
      data: [makeRequest({ meetsMinimumTenure: false, employeeTenureDays: 90 })],
      isLoading: false,
      refetch,
    });
    mutate.mockImplementation((_vars, { onError }) =>
      onError({ isAxiosError: true, response: { status: 409, data: { error: { code: "INELIGIBLE_TENURE" } } } })
    );
    const user = userEvent.setup();

    render(<CurrentHrQueue />);
    await user.click(screen.getByRole("button", { name: "Accept" }));
    await user.click(screen.getByRole("button", { name: "Accept anyway" }));

    expect(mutate).toHaveBeenCalled();
    expect(await screen.findByText(/does not meet the 6-month minimum tenure requirement\./)).toBeInTheDocument();
    expect(screen.getByText("Jamie Employee")).toBeInTheDocument();
  });

  it("AC4 — Accept on an eligible request succeeds", async () => {
    useCurrentHrQueue.mockReturnValue({ data: [makeRequest()], isLoading: false, refetch });
    mutate.mockImplementation((_vars, { onSuccess }) => onSuccess());
    const user = userEvent.setup();

    render(<CurrentHrQueue />);
    await user.click(screen.getByRole("button", { name: "Accept" }));

    expect(screen.getByText("Request approved.")).toBeInTheDocument();
  });

  it("AC5 — Reject submits successfully with no reason required", async () => {
    useCurrentHrQueue.mockReturnValue({ data: [makeRequest()], isLoading: false, refetch });
    mutate.mockImplementation((_vars, { onSuccess }) => onSuccess());
    const user = userEvent.setup();

    render(<CurrentHrQueue />);
    await user.click(screen.getByRole("button", { name: "Reject" }));
    await user.click(screen.getByRole("button", { name: "Confirm reject" }));

    expect(mutate).toHaveBeenCalledWith(
      { id: "tr-1", payload: { decision: "reject", reason: undefined } },
      expect.any(Object)
    );
    expect(screen.getByText("Request rejected.")).toBeInTheDocument();
  });

  it("AC6 — shows an explicit empty state", () => {
    useCurrentHrQueue.mockReturnValue({ data: [], isLoading: false, refetch });

    render(<CurrentHrQueue />);

    expect(screen.getByText("No requests waiting on your approval.")).toBeInTheDocument();
  });

  it("AC7 — 409 INVALID_STATUS_TRANSITION explains and refetches", async () => {
    useCurrentHrQueue.mockReturnValue({ data: [makeRequest()], isLoading: false, refetch });
    mutate.mockImplementation((_vars, { onError }) =>
      onError({ isAxiosError: true, response: { status: 409, data: { error: { code: "INVALID_STATUS_TRANSITION" } } } })
    );
    const user = userEvent.setup();

    render(<CurrentHrQueue />);
    await user.click(screen.getByRole("button", { name: "Accept" }));

    expect(await screen.findByText(/no longer pending/)).toBeInTheDocument();
    expect(refetch).toHaveBeenCalled();
  });

  it("AC8 — shows an escalation indicator", () => {
    useCurrentHrQueue.mockReturnValue({ data: [makeRequest({ escalated: true })], isLoading: false, refetch });

    render(<CurrentHrQueue />);

    expect(screen.getByText("Escalated")).toBeInTheDocument();
  });
});
