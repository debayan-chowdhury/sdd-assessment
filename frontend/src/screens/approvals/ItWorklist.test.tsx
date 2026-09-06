import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ItWorklist } from "@/screens/approvals/ItWorklist";

const useAuthStoreState = vi.fn();

vi.mock("@/features/auth/auth.store", () => ({
  useAuthStore: (selector: (state: unknown) => unknown) => selector(useAuthStoreState()),
}));

vi.mock("@/features/transfer-request/transfer-request.queries", () => ({
  useItWorklist: () => ({ data: [], isLoading: false, refetch: vi.fn() }),
  useEmployeeNames: () => ({ data: [], isLoading: false }),
  useLocationOptions: () => ({ data: [], isLoading: false }),
  useAllDepartmentOptions: () => ({ data: [], isLoading: false }),
  useRoleOptions: () => ({ data: [], isLoading: false }),
}));

vi.mock("@/features/transfer-request/transfer-request.mutations", () => ({
  useItStatusUpdate: () => ({ mutate: vi.fn(), isPending: false }),
}));

describe("ItWorklist", () => {
  it("AC1 — renders the IT section for roleCategory IT", () => {
    useAuthStoreState.mockReturnValue({ employee: { roleCategory: "IT" } });

    render(<ItWorklist />);

    expect(screen.getByText("IT")).toBeInTheDocument();
  });

  it("AC1 — is not rendered for any other roleCategory", () => {
    useAuthStoreState.mockReturnValue({ employee: { roleCategory: "Facilities" } });

    const { container } = render(<ItWorklist />);

    expect(container).toBeEmptyDOMElement();
  });
});
