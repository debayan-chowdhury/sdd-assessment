import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { FacilitiesWorklist } from "@/screens/approvals/FacilitiesWorklist";

const useAuthStoreState = vi.fn();

vi.mock("@/features/auth/auth.store", () => ({
  useAuthStore: (selector: (state: unknown) => unknown) => selector(useAuthStoreState()),
}));

vi.mock("@/features/transfer-request/transfer-request.queries", () => ({
  useFacilitiesWorklist: () => ({ data: [], isLoading: false, refetch: vi.fn() }),
  useEmployeeNames: () => ({ data: [], isLoading: false }),
  useLocationOptions: () => ({ data: [], isLoading: false }),
  useAllDepartmentOptions: () => ({ data: [], isLoading: false }),
  useRoleOptions: () => ({ data: [], isLoading: false }),
}));

vi.mock("@/features/transfer-request/transfer-request.mutations", () => ({
  useFacilitiesStatusUpdate: () => ({ mutate: vi.fn(), isPending: false }),
}));

describe("FacilitiesWorklist", () => {
  it("AC1 — renders the Facilities section for roleCategory Facilities", () => {
    useAuthStoreState.mockReturnValue({ employee: { roleCategory: "Facilities" } });

    render(<FacilitiesWorklist />);

    expect(screen.getByText("Facilities")).toBeInTheDocument();
  });

  it("AC1 — is not rendered for any other roleCategory", () => {
    useAuthStoreState.mockReturnValue({ employee: { roleCategory: "Payroll" } });

    const { container } = render(<FacilitiesWorklist />);

    expect(container).toBeEmptyDOMElement();
  });
});
