import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { PayrollWorklist } from "@/screens/approvals/PayrollWorklist";

const useAuthStoreState = vi.fn();

vi.mock("@/features/auth/auth.store", () => ({
  useAuthStore: (selector: (state: unknown) => unknown) => selector(useAuthStoreState()),
}));

vi.mock("@/features/transfer-request/transfer-request.queries", () => ({
  usePayrollWorklist: () => ({ data: [], isLoading: false, refetch: vi.fn() }),
  useEmployeeNames: () => ({ data: [], isLoading: false }),
  useLocationOptions: () => ({ data: [], isLoading: false }),
  useAllDepartmentOptions: () => ({ data: [], isLoading: false }),
  useRoleOptions: () => ({ data: [], isLoading: false }),
}));

vi.mock("@/features/transfer-request/transfer-request.mutations", () => ({
  usePayrollStatusUpdate: () => ({ mutate: vi.fn(), isPending: false }),
}));

describe("PayrollWorklist", () => {
  it("AC1 — renders the Payroll section for roleCategory Payroll", () => {
    useAuthStoreState.mockReturnValue({ employee: { roleCategory: "Payroll" } });

    render(<PayrollWorklist />);

    expect(screen.getByText("Payroll")).toBeInTheDocument();
  });

  it("AC1 — is not rendered for any other roleCategory", () => {
    useAuthStoreState.mockReturnValue({ employee: { roleCategory: "IT" } });

    const { container } = render(<PayrollWorklist />);

    expect(container).toBeEmptyDOMElement();
  });
});
