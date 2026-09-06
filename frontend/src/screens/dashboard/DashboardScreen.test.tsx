import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { DashboardScreen } from "@/screens/dashboard/DashboardScreen";

const useProfile = vi.fn();
const useMyTransferRequests = vi.fn();
const useCurrentManagerQueue = vi.fn();
const useReceivingManagerQueue = vi.fn();
const useCurrentHrQueue = vi.fn();
const useReceivingHrGateQueue = vi.fn();
const useReceivingHrFulfillmentQueue = vi.fn();
const useReceivingHrHoldQueue = vi.fn();
const usePayrollWorklist = vi.fn();
const useItWorklist = vi.fn();
const useFacilitiesWorklist = vi.fn();

vi.mock("@/features/auth/auth.queries", () => ({
  useProfile: () => useProfile(),
}));

vi.mock("@/features/transfer-request/transfer-request.queries", () => ({
  useMyTransferRequests: () => useMyTransferRequests(),
  useEmployeeNames: () => ({ data: [], isLoading: false }),
  useLocationOptions: () => ({ data: [{ id: "loc-1", name: "Delhi" }], isLoading: false }),
  useAllDepartmentOptions: () => ({ data: [{ id: "dept-1", name: "Finance" }], isLoading: false }),
  useRoleOptions: () => ({ data: [{ id: "role-1", name: "Analyst" }], isLoading: false }),
  useCurrentManagerQueue: (enabled: boolean) => useCurrentManagerQueue(enabled),
  useReceivingManagerQueue: (enabled: boolean) => useReceivingManagerQueue(enabled),
  useCurrentHrQueue: (enabled: boolean) => useCurrentHrQueue(enabled),
  useReceivingHrGateQueue: (enabled: boolean) => useReceivingHrGateQueue(enabled),
  useReceivingHrFulfillmentQueue: (enabled: boolean) => useReceivingHrFulfillmentQueue(enabled),
  useReceivingHrHoldQueue: (enabled: boolean) => useReceivingHrHoldQueue(enabled),
  usePayrollWorklist: (enabled: boolean) => usePayrollWorklist(enabled),
  useItWorklist: (enabled: boolean) => useItWorklist(enabled),
  useFacilitiesWorklist: (enabled: boolean) => useFacilitiesWorklist(enabled),
}));

const emptyQueue = { data: [], isLoading: false };

function setEmployeeAndQueues(profile: Record<string, unknown> | null) {
  useProfile.mockReturnValue({ data: profile });
  useCurrentManagerQueue.mockReturnValue(emptyQueue);
  useReceivingManagerQueue.mockReturnValue(emptyQueue);
  useCurrentHrQueue.mockReturnValue(emptyQueue);
  useReceivingHrGateQueue.mockReturnValue(emptyQueue);
  useReceivingHrFulfillmentQueue.mockReturnValue(emptyQueue);
  useReceivingHrHoldQueue.mockReturnValue(emptyQueue);
  usePayrollWorklist.mockReturnValue(emptyQueue);
  useItWorklist.mockReturnValue(emptyQueue);
  useFacilitiesWorklist.mockReturnValue(emptyQueue);
}

const baseEmployee = {
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

describe("DashboardScreen", () => {
  it("shows the employee's profile resolved to display names", () => {
    setEmployeeAndQueues(baseEmployee);
    useMyTransferRequests.mockReturnValue({ data: [], isLoading: false });

    render(<DashboardScreen />);

    expect(screen.getByText("Welcome, Jamie Employee")).toBeInTheDocument();
    expect(screen.getByText("Analyst")).toBeInTheDocument();
    expect(screen.getByText("Finance")).toBeInTheDocument();
    expect(screen.getByText("Delhi")).toBeInTheDocument();
  });

  it("offers to start a new transfer request when none is on file", () => {
    setEmployeeAndQueues(baseEmployee);
    useMyTransferRequests.mockReturnValue({ data: [], isLoading: false });

    render(<DashboardScreen />);

    expect(screen.getByText("You have no transfer request on file.")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Start a new transfer request" })).toHaveAttribute(
      "href",
      "/transfer-request/new"
    );
  });

  it("shows a per-role status stepper for an active request", () => {
    setEmployeeAndQueues(baseEmployee);
    useMyTransferRequests.mockReturnValue({
      data: [
        {
          id: "tr-1",
          status: "Pending Receiving HR Approval",
          effectiveDate: "2026-12-01",
          escalated: false,
          reason: null,
          rejectionReason: null,
          holdReason: null,
          payrollStatus: null,
          itStatus: null,
          facilitiesStatus: null,
        },
      ],
      isLoading: false,
    });

    render(<DashboardScreen />);

    expect(screen.getAllByText("Approved")).toHaveLength(2); // Current Manager, Current HR
    expect(screen.getByText("In progress")).toBeInTheDocument(); // Receiving HR
    expect(screen.getAllByText("Not yet reached").length).toBeGreaterThan(0);
    expect(screen.getByRole("link", { name: "View full status" })).toHaveAttribute(
      "href",
      "/transfer-request/tr-1"
    );
  });

  it("shows a Rejected banner instead of the stepper for a rejected request", () => {
    setEmployeeAndQueues(baseEmployee);
    useMyTransferRequests.mockReturnValue({
      data: [
        {
          id: "tr-1",
          status: "Rejected",
          effectiveDate: "2026-12-01",
          escalated: false,
          reason: null,
          rejectionReason: "No headcount.",
          holdReason: null,
          payrollStatus: null,
          itStatus: null,
          facilitiesStatus: null,
        },
      ],
      isLoading: false,
    });

    render(<DashboardScreen />);

    expect(screen.getByText("No headcount.")).toBeInTheDocument();
    expect(screen.queryByText("In progress")).not.toBeInTheDocument();
  });

  it("does not show a queues section for a plain Employee", () => {
    setEmployeeAndQueues(baseEmployee);
    useMyTransferRequests.mockReturnValue({ data: [], isLoading: false });

    render(<DashboardScreen />);

    expect(screen.queryByText("Your queues")).not.toBeInTheDocument();
  });

  it("does not enable the Payroll/IT/Facilities queries for a plain Employee (those 403 for anyone else)", () => {
    setEmployeeAndQueues(baseEmployee);
    useMyTransferRequests.mockReturnValue({ data: [], isLoading: false });

    render(<DashboardScreen />);

    expect(usePayrollWorklist).toHaveBeenCalledWith(false);
    expect(useItWorklist).toHaveBeenCalledWith(false);
    expect(useFacilitiesWorklist).toHaveBeenCalledWith(false);
    expect(useCurrentManagerQueue).toHaveBeenCalledWith(false);
    expect(useCurrentHrQueue).toHaveBeenCalledWith(false);
  });

  it("shows pending queue counts for an approver role", () => {
    setEmployeeAndQueues({ ...baseEmployee, roleCategory: "Manager" });
    useMyTransferRequests.mockReturnValue({ data: [], isLoading: false });
    useCurrentManagerQueue.mockReturnValue({ data: [{ id: "a" }, { id: "b" }], isLoading: false });

    render(<DashboardScreen />);

    expect(screen.getByText("Your queues")).toBeInTheDocument();
    expect(screen.getByText("Current Manager approvals")).toBeInTheDocument();
    expect(screen.getByText("2 pending")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Go to your approvals inbox" })).toHaveAttribute(
      "href",
      "/approvals"
    );
  });
});
