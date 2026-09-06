import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { TransferRequestSummaryCard } from "@/screens/transfer-request/components/TransferRequestSummaryCard";
import type { TransferRequest } from "@/types/transferRequest";

const useProfile = vi.fn();

vi.mock("@/features/auth/auth.queries", () => ({
  useProfile: () => useProfile(),
}));

function makeRequest(overrides: Partial<TransferRequest> = {}): TransferRequest {
  return {
    id: "tr-1",
    employeeId: "emp-1",
    currentLocationId: "loc-0",
    currentDepartmentId: "dept-0",
    currentRoleId: "role-0",
    currentManagerId: "mgr-1",
    currentManagerName: "Alex Manager",
    currentHrId: "hr-1",
    currentHrName: "Sam HR",
    receivingHrId: "rhr-1",
    receivingHrName: "Taylor RHR",
    receivingManagerId: null,
    receivingManagerName: null,
    newLocationId: "loc-1",
    newDepartmentId: "dept-1",
    newRoleId: "role-1",
    effectiveDate: "2026-12-01",
    reason: null,
    escalated: false,
    escalatedAt: null,
    createdAt: "2026-11-01T00:00:00.000Z",
    status: "Pending Current HR Approval",
    rejectionReason: null,
    holdReason: null,
    payrollStatus: null,
    itStatus: null,
    facilitiesStatus: null,
    ...overrides,
  };
}

describe("TransferRequestSummaryCard", () => {
  it("shows the Current Manager/HR from the live profile, and Receiving Manager/HR from the request, by name", () => {
    useProfile.mockReturnValue({ data: { managerName: "Jordan Manager", hrName: "Riley HR" } });

    render(<TransferRequestSummaryCard request={makeRequest({ receivingManagerId: "new-mgr-1", receivingManagerName: "Casey Manager" })} />);

    expect(screen.getByText("Current Manager:")).toBeInTheDocument();
    expect(screen.getByText("Jordan Manager")).toBeInTheDocument();
    expect(screen.getByText("Current HR:")).toBeInTheDocument();
    expect(screen.getByText("Riley HR")).toBeInTheDocument();
    expect(screen.getByText("Receiving Manager:")).toBeInTheDocument();
    expect(screen.getByText("Casey Manager")).toBeInTheDocument();
    expect(screen.getByText("Receiving HR:")).toBeInTheDocument();
    expect(screen.getByText("Taylor RHR")).toBeInTheDocument();
  });

  it("shows a placeholder for Current Manager/HR (profile unresolved) and Receiving Manager (not yet assigned)", () => {
    useProfile.mockReturnValue({ data: undefined });

    render(<TransferRequestSummaryCard request={makeRequest()} />);

    expect(screen.getByText("Current Manager:")).toBeInTheDocument();
    expect(screen.getByText("Receiving HR:")).toBeInTheDocument();
    expect(screen.getByText("Taylor RHR")).toBeInTheDocument();
    // Current Manager, Current HR (profile unresolved), Receiving Manager (not yet assigned).
    expect(screen.getAllByText("—")).toHaveLength(3);
  });

  it("still shows Current Manager and HR for a branch status (e.g. Rejected), even though the stepper is hidden", () => {
    useProfile.mockReturnValue({ data: { managerName: "Jordan Manager", hrName: "Riley HR" } });

    render(<TransferRequestSummaryCard request={makeRequest({ status: "Rejected", rejectionReason: "No fit." })} />);

    expect(screen.getByText("Jordan Manager")).toBeInTheDocument();
    expect(screen.getByText("No fit.")).toBeInTheDocument();
    // The stepper itself (stage progress badges) should not render for a branch status.
    expect(screen.queryByText("Receiving HR")).not.toBeInTheDocument();
    expect(screen.queryByText("Approved")).not.toBeInTheDocument();
  });

  it("shows the deferred org-update banner once accepted (receivingManagerId set) but not yet applied", () => {
    useProfile.mockReturnValue({ data: { managerName: "Jordan Manager", hrName: "Riley HR" } });

    render(
      <TransferRequestSummaryCard
        request={makeRequest({
          status: "Pending Fulfillment",
          receivingManagerId: "new-mgr-1",
          orgDataAppliedAt: null,
          effectiveDate: "2026-12-25",
        })}
      />
    );

    const banner = screen.getByText(/will update automatically on your effective date/);
    expect(banner).toBeInTheDocument();
    expect(banner.textContent).toContain("2026-12-25");
  });

  it("hides the deferred org-update banner and the Receiving Manager/HR rows once orgDataAppliedAt is set", () => {
    useProfile.mockReturnValue({ data: { managerName: "Jordan Manager", hrName: "Riley HR" } });

    render(
      <TransferRequestSummaryCard
        request={makeRequest({
          status: "Completed",
          receivingManagerId: "new-mgr-1",
          receivingManagerName: "Casey Manager",
          orgDataAppliedAt: "2026-12-25T00:00:00.000Z",
        })}
      />
    );

    expect(screen.queryByText(/will update automatically/)).not.toBeInTheDocument();
    // Once applied, Receiving Manager/HR are by definition the same as
    // Current Manager/HR — the redundant rows are hidden entirely.
    expect(screen.queryByText("Receiving Manager:")).not.toBeInTheDocument();
    expect(screen.queryByText("Receiving HR:")).not.toBeInTheDocument();
    expect(screen.queryByText("Casey Manager")).not.toBeInTheDocument();
    expect(screen.queryByText("Taylor RHR")).not.toBeInTheDocument();
    // Current Manager/HR are still shown.
    expect(screen.getByText("Jordan Manager")).toBeInTheDocument();
  });

  it("hides the deferred org-update banner before Receiving HR has accepted (no receivingManagerId)", () => {
    useProfile.mockReturnValue({ data: { managerName: "Jordan Manager", hrName: "Riley HR" } });

    render(<TransferRequestSummaryCard request={makeRequest({ receivingManagerId: null })} />);

    expect(screen.queryByText(/will update automatically/)).not.toBeInTheDocument();
  });
});
