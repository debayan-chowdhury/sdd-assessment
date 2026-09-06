import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { TransferRequestHomeScreen } from "@/screens/transfer-request/TransferRequestHomeScreen";

const useProfile = vi.fn();
const useMyTransferRequests = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: vi.fn() }),
}));

vi.mock("@/features/auth/auth.queries", () => ({
  useProfile: () => useProfile(),
}));

vi.mock("@/features/transfer-request/transfer-request.queries", () => ({
  useMyTransferRequests: () => useMyTransferRequests(),
  useEmployeeNames: () => ({ data: [], isLoading: false }),
  useLocationOptions: () => ({ data: [{ id: "loc-1", name: "Delhi" }], isLoading: false }),
  useAllDepartmentOptions: () => ({ data: [{ id: "dept-1", name: "Finance" }], isLoading: false }),
  useRoleOptions: () => ({ data: [{ id: "role-1", name: "Analyst" }], isLoading: false }),
}));

vi.mock("@/features/transfer-request/transfer-request.mutations", () => ({
  useSubmitTransferRequest: () => ({ mutate: vi.fn(), isPending: false }),
}));

vi.mock("@/features/transfer-request/useTransferRequestOptions", () => ({
  useTransferRequestOptions: () => ({ locations: [], departments: [], roles: [], isLoading: false, isBlocked: true }),
}));

const baseProfile = {
  id: "emp-1",
  name: "Jamie Employee",
  email: "jamie@example.com",
  locationId: "loc-1",
  locationName: "Delhi",
  departmentId: "dept-1",
  departmentName: "Finance",
  roleId: "role-1",
  roleName: "Analyst",
  roleCategory: null,
  managerId: null,
  managerName: null,
  hrId: null,
  hrName: null,
  mustChangePassword: false,
};

function makeRequest(overrides = {}) {
  return {
    id: "tr-1",
    employeeId: "emp-1",
    newLocationId: "loc-1",
    newDepartmentId: "dept-1",
    newRoleId: "role-1",
    effectiveDate: "2026-12-01",
    escalated: false,
    rejectionReason: null,
    holdReason: null,
    payrollStatus: null,
    itStatus: null,
    facilitiesStatus: null,
    ...overrides,
  };
}

describe("TransferRequestHomeScreen", () => {
  it("shows the employee's own info at the top", () => {
    useProfile.mockReturnValue({ data: baseProfile });
    useMyTransferRequests.mockReturnValue({ data: [], isLoading: false });

    render(<TransferRequestHomeScreen />);

    expect(screen.getByText("Jamie Employee")).toBeInTheDocument();
    expect(screen.getByText("jamie@example.com")).toBeInTheDocument();
    expect(screen.getByText("Analyst")).toBeInTheDocument();
    expect(screen.getByText("Finance")).toBeInTheDocument();
    expect(screen.getByText("Delhi")).toBeInTheDocument();
  });

  it("shows the new-request form when the user has no non-terminal request", () => {
    useProfile.mockReturnValue({ data: baseProfile });
    useMyTransferRequests.mockReturnValue({ data: [], isLoading: false });

    render(<TransferRequestHomeScreen />);

    expect(screen.getByText("New transfer request")).toBeInTheDocument();
  });

  it("shows the new-request form AND the most recent (terminal) request's status when every request is terminal", () => {
    useProfile.mockReturnValue({ data: baseProfile });
    useMyTransferRequests.mockReturnValue({
      data: [
        makeRequest({ id: "newest-rejected", status: "Rejected", rejectionReason: "No headcount." }),
        makeRequest({ id: "old-2", status: "Completed" }),
      ],
      isLoading: false,
    });

    render(<TransferRequestHomeScreen />);

    expect(screen.getByText("New transfer request")).toBeInTheDocument();
    // The most recent request (first in the newest-first array) is shown,
    // Current Manager/HR included, even though it's a terminal/Rejected one.
    expect(screen.getByText("No headcount.")).toBeInTheDocument();
    expect(screen.getByText("Current Manager:")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "View full status" })).toHaveAttribute(
      "href",
      "/transfer-request/newest-rejected"
    );
  });

  it("shows the active request's status, not the new-request form, when one exists", () => {
    useProfile.mockReturnValue({ data: baseProfile });
    useMyTransferRequests.mockReturnValue({
      data: [makeRequest({ id: "active-1", status: "Hold", holdReason: "All candidate managers rejected." })],
      isLoading: false,
    });

    render(<TransferRequestHomeScreen />);

    expect(screen.getByText("All candidate managers rejected.")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "View full status" })).toHaveAttribute(
      "href",
      "/transfer-request/active-1"
    );
    expect(screen.queryByText("New transfer request")).not.toBeInTheDocument();
  });

  it("always links to the history page, on a separate route", () => {
    useProfile.mockReturnValue({ data: baseProfile });
    useMyTransferRequests.mockReturnValue({ data: [], isLoading: false });

    render(<TransferRequestHomeScreen />);

    expect(screen.getByRole("link", { name: "View request history" })).toHaveAttribute(
      "href",
      "/transfer-request/history"
    );
  });
});
