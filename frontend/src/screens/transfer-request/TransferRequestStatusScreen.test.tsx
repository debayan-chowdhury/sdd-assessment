import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { TransferRequestStatusScreen } from "@/screens/transfer-request/TransferRequestStatusScreen";

const useTransferRequest = vi.fn();
const useProfile = vi.fn();

vi.mock("@/features/transfer-request/transfer-request.queries", () => ({
  useTransferRequest: (id: string) => useTransferRequest(id),
}));

vi.mock("@/features/auth/auth.queries", () => ({
  useProfile: () => useProfile(),
}));

const baseRequest = {
  id: "tr-1",
  employeeId: "e1",
  currentLocationId: "l1",
  currentDepartmentId: "d1",
  currentRoleId: "r1",
  newLocationId: "l2",
  newDepartmentId: "d2",
  newRoleId: "r2",
  effectiveDate: "2026-12-01",
  reason: null,
  status: "Pending Current Manager Approval",
  currentManagerId: "m1",
  currentManagerName: "Alex Manager",
  currentHrId: "h1",
  currentHrName: "Sam HR",
  receivingHrId: "h2",
  receivingHrName: "Taylor RHR",
  receivingManagerId: null,
  receivingManagerName: null,
  orgDataAppliedAt: null,
  payrollStatus: null,
  itStatus: null,
  facilitiesStatus: null,
  rejectionReason: null,
  holdReason: null,
  escalated: false,
  escalatedAt: null,
  createdAt: "2026-01-01",
} as const;

describe("TransferRequestStatusScreen", () => {
  it("shows the raw status and sub-statuses once past fulfillment trigger", () => {
    useProfile.mockReturnValue({ data: { managerName: "Jordan Manager", hrName: "Riley HR" } });
    useTransferRequest.mockReturnValue({
      data: { ...baseRequest, status: "Pending Fulfillment", payrollStatus: "Done", itStatus: "Pending", facilitiesStatus: "Not Applicable" },
      isLoading: false,
      error: null,
    });

    render(<TransferRequestStatusScreen id="tr-1" />);

    expect(screen.getByText("Pending Fulfillment")).toBeInTheDocument();
    expect(screen.getByText("Done")).toBeInTheDocument();
    expect(screen.getByText("Pending")).toBeInTheDocument();
    expect(screen.getByText("Not Applicable")).toBeInTheDocument();
    // Already on the detail page — the self-referential link is suppressed.
    expect(screen.queryByRole("link", { name: /view full status/i })).not.toBeInTheDocument();
  });

  it("shows the reason when the employee provided one", () => {
    useProfile.mockReturnValue({ data: { managerName: "Jordan Manager", hrName: "Riley HR" } });
    useTransferRequest.mockReturnValue({
      data: { ...baseRequest, reason: "Relocating closer to family." },
      isLoading: false,
      error: null,
    });

    render(<TransferRequestStatusScreen id="tr-1" />);

    expect(screen.getByText("Relocating closer to family.")).toBeInTheDocument();
  });

  it("shows the rejection reason and no action for a Rejected request", () => {
    useProfile.mockReturnValue({ data: { managerName: "Jordan Manager", hrName: "Riley HR" } });
    useTransferRequest.mockReturnValue({
      data: { ...baseRequest, status: "Rejected", rejectionReason: "No open headcount." },
      isLoading: false,
      error: null,
    });

    render(<TransferRequestStatusScreen id="tr-1" />);

    expect(screen.getByText("No open headcount.")).toBeInTheDocument();
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("shows the hold reason and 6-month explanation for a Hold request", () => {
    useProfile.mockReturnValue({ data: { managerName: "Jordan Manager", hrName: "Riley HR" } });
    useTransferRequest.mockReturnValue({
      data: { ...baseRequest, status: "Hold", holdReason: "All candidates rejected." },
      isLoading: false,
      error: null,
    });

    render(<TransferRequestStatusScreen id="tr-1" />);

    expect(screen.getByText("All candidates rejected.")).toBeInTheDocument();
    expect(screen.getByText(/6-month window/)).toBeInTheDocument();
  });

  it("shows a generic not-found state on a 403 (doesn't distinguish from 404), with a way back", () => {
    useProfile.mockReturnValue({ data: undefined });
    useTransferRequest.mockReturnValue({
      data: undefined,
      isLoading: false,
      error: { isAxiosError: true, response: { status: 403 } },
    });

    render(<TransferRequestStatusScreen id="tr-2" />);

    expect(screen.getByText("Request not found.")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /back to your transfer request/i })).toHaveAttribute(
      "href",
      "/transfer-request"
    );
  });

  it("shows an escalation indicator when escalated is true", () => {
    useProfile.mockReturnValue({ data: { managerName: "Jordan Manager", hrName: "Riley HR" } });
    useTransferRequest.mockReturnValue({
      data: { ...baseRequest, escalated: true },
      isLoading: false,
      error: null,
    });

    render(<TransferRequestStatusScreen id="tr-1" />);

    expect(screen.getByText("Escalated")).toBeInTheDocument();
  });
});
