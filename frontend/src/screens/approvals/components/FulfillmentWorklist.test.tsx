import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { FulfillmentWorklist } from "@/screens/approvals/components/FulfillmentWorklist";

const useAuthStoreState = vi.fn();
const useWorklist = vi.fn();
const mutate = vi.fn();
const refetch = vi.fn();

vi.mock("@/features/auth/auth.store", () => ({
  useAuthStore: (selector: (state: unknown) => unknown) => selector(useAuthStoreState()),
}));

vi.mock("@/features/transfer-request/transfer-request.queries", () => ({
  useEmployeeNames: () => ({ data: [{ id: "emp-1", name: "Jamie Employee" }], isLoading: false }),
  useLocationOptions: () => ({ data: [{ id: "loc-1", name: "Delhi" }], isLoading: false }),
  useAllDepartmentOptions: () => ({ data: [{ id: "dept-1", name: "Finance" }], isLoading: false }),
  useRoleOptions: () => ({ data: [{ id: "role-1", name: "Analyst" }], isLoading: false }),
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
    payrollStatus: "Pending",
    ...overrides,
  };
}

function renderWorklist() {
  return render(
    <FulfillmentWorklist
      title="Payroll"
      roleCategory="Payroll"
      statusField="payrollStatus"
      useWorklist={(enabled) => useWorklist(enabled)}
      useStatusUpdate={() => ({ mutate, isPending: false })}
    />
  );
}

describe("FulfillmentWorklist", () => {
  beforeEach(() => {
    mutate.mockReset();
    refetch.mockReset();
    useWorklist.mockReset();
  });

  it("AC1 — is not rendered for a mismatched roleCategory, and does not even fire the request", () => {
    useAuthStoreState.mockReturnValue({ employee: { roleCategory: "HR" } });
    useWorklist.mockReturnValue({ data: [makeRequest()], isLoading: false, refetch });

    const { container } = renderWorklist();

    expect(container).toBeEmptyDOMElement();
    expect(useWorklist).toHaveBeenCalledWith(false);
  });

  it("AC2 — renders employee/target details and the current sub-status", () => {
    useAuthStoreState.mockReturnValue({ employee: { roleCategory: "Payroll" } });
    useWorklist.mockReturnValue({ data: [makeRequest()], isLoading: false, refetch });

    renderWorklist();

    expect(screen.getByText("Jamie Employee")).toBeInTheDocument();
    expect(screen.getByText("Pending")).toBeInTheDocument();
    expect(useWorklist).toHaveBeenCalledWith(true);
  });

  it("AC3 — Mark Done removes the item with a success confirmation", async () => {
    useAuthStoreState.mockReturnValue({ employee: { roleCategory: "Payroll" } });
    useWorklist.mockReturnValue({ data: [makeRequest()], isLoading: false, refetch });
    mutate.mockImplementation((_vars, { onSuccess }) => onSuccess());
    const user = userEvent.setup();

    renderWorklist();
    await user.click(screen.getByRole("button", { name: "Mark Done" }));

    expect(mutate).toHaveBeenCalledWith({ id: "tr-1", payload: { status: "Done" } }, expect.any(Object));
    expect(screen.getByText("Marked done.")).toBeInTheDocument();
  });

  it("AC4 — shows an explicit empty state", () => {
    useAuthStoreState.mockReturnValue({ employee: { roleCategory: "Payroll" } });
    useWorklist.mockReturnValue({ data: [], isLoading: false, refetch });

    renderWorklist();

    expect(screen.getByText("No requests waiting on your action.")).toBeInTheDocument();
  });

  it("AC5 — 409 INVALID_STATUS_TRANSITION explains and refetches", async () => {
    useAuthStoreState.mockReturnValue({ employee: { roleCategory: "Payroll" } });
    useWorklist.mockReturnValue({ data: [makeRequest()], isLoading: false, refetch });
    mutate.mockImplementation((_vars, { onError }) =>
      onError({ isAxiosError: true, response: { status: 409, data: { error: { code: "INVALID_STATUS_TRANSITION" } } } })
    );
    const user = userEvent.setup();

    renderWorklist();
    await user.click(screen.getByRole("button", { name: "Mark Done" }));

    expect(await screen.findByText(/no longer actionable/)).toBeInTheDocument();
    expect(refetch).toHaveBeenCalled();
  });

  it("AC6 — shows an escalation indicator", () => {
    useAuthStoreState.mockReturnValue({ employee: { roleCategory: "Payroll" } });
    useWorklist.mockReturnValue({ data: [makeRequest({ escalated: true })], isLoading: false, refetch });

    renderWorklist();

    expect(screen.getByText("Escalated")).toBeInTheDocument();
  });
});
