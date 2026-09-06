import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { TransferRequestHistoryScreen } from "@/screens/transfer-request/TransferRequestHistoryScreen";

const useMyTransferRequests = vi.fn();
const useProfile = vi.fn();

vi.mock("@/features/transfer-request/transfer-request.queries", () => ({
  useMyTransferRequests: () => useMyTransferRequests(),
  useEmployeeNames: () => ({ data: [], isLoading: false }),
}));

vi.mock("@/features/auth/auth.queries", () => ({
  useProfile: () => useProfile(),
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
    currentManagerName: "Alex Manager",
    currentHrName: "Sam HR",
    rejectionReason: null,
    holdReason: null,
    payrollStatus: null,
    itStatus: null,
    facilitiesStatus: null,
    ...overrides,
  };
}

describe("TransferRequestHistoryScreen", () => {
  beforeEach(() => {
    useProfile.mockReturnValue({ data: { managerName: "Jordan Manager", hrName: "Riley HR" } });
  });

  it("has a Back link to /transfer-request", () => {
    useMyTransferRequests.mockReturnValue({ data: [], isLoading: false });

    render(<TransferRequestHistoryScreen />);

    expect(screen.getByRole("link", { name: "Back" })).toHaveAttribute("href", "/transfer-request");
  });

  it("shows an empty state when no requests have ever been submitted", () => {
    useMyTransferRequests.mockReturnValue({ data: [], isLoading: false });

    render(<TransferRequestHistoryScreen />);

    expect(screen.getByText("You haven't submitted any transfer requests yet.")).toBeInTheDocument();
  });

  it("lists every request, including terminal ones", () => {
    useMyTransferRequests.mockReturnValue({
      data: [
        makeRequest({ id: "old-1", status: "Rejected" }),
        makeRequest({ id: "old-2", status: "Completed" }),
        makeRequest({ id: "active-1", status: "Hold" }),
      ],
      isLoading: false,
    });

    render(<TransferRequestHistoryScreen />);

    const links = screen.getAllByRole("link", { name: "View full status" });
    expect(links).toHaveLength(3);
    expect(links.map((link) => link.getAttribute("href"))).toEqual([
      "/transfer-request/old-1",
      "/transfer-request/old-2",
      "/transfer-request/active-1",
    ]);
  });

  it("shows Current Manager/HR (live profile) for each entry", () => {
    useMyTransferRequests.mockReturnValue({
      data: [makeRequest({ id: "old-1", status: "Rejected" })],
      isLoading: false,
    });

    render(<TransferRequestHistoryScreen />);

    expect(screen.getByText("Current Manager:")).toBeInTheDocument();
    expect(screen.getByText("Jordan Manager")).toBeInTheDocument();
    expect(screen.getByText("Current HR:")).toBeInTheDocument();
    expect(screen.getByText("Riley HR")).toBeInTheDocument();
    expect(screen.queryByText("Previous Manager:")).not.toBeInTheDocument();
    expect(screen.queryByText("Previous HR:")).not.toBeInTheDocument();
  });
});
