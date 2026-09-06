import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { RejectionBanner } from "@/screens/transfer-request/components/RejectionBanner";
import { HoldBanner } from "@/screens/transfer-request/components/HoldBanner";
import { EscalationIndicator } from "@/screens/transfer-request/components/EscalationIndicator";
import { StatusBadge } from "@/screens/transfer-request/components/StatusBadge";
import { SubStatusList } from "@/screens/transfer-request/components/SubStatusList";

describe("RejectionBanner", () => {
  it("shows the rejection reason when present", () => {
    render(<RejectionBanner reason="No open headcount." />);
    expect(screen.getByText("No open headcount.")).toBeInTheDocument();
  });

  it("renders without a reason", () => {
    render(<RejectionBanner reason={null} />);
    expect(screen.getByText(/rejected/i)).toBeInTheDocument();
  });
});

describe("HoldBanner", () => {
  it("shows the hold reason and the 6-month reopen explanation", () => {
    render(<HoldBanner reason="All candidate managers rejected." />);
    expect(screen.getByText("All candidate managers rejected.")).toBeInTheDocument();
    expect(screen.getByText(/6-month window/)).toBeInTheDocument();
  });
});

describe("EscalationIndicator", () => {
  it("renders an escalated label", () => {
    render(<EscalationIndicator />);
    expect(screen.getByText("Escalated")).toBeInTheDocument();
  });
});

describe("StatusBadge", () => {
  it("renders the raw status string", () => {
    render(<StatusBadge status="Pending Current Manager Approval" />);
    expect(screen.getByText("Pending Current Manager Approval")).toBeInTheDocument();
  });
});

describe("SubStatusList", () => {
  it("shows only non-null sub-statuses", () => {
    render(<SubStatusList payrollStatus="Done" itStatus={null} facilitiesStatus="Not Applicable" />);
    expect(screen.getByText("Payroll:")).toBeInTheDocument();
    expect(screen.getByText("Done")).toBeInTheDocument();
    expect(screen.queryByText("IT:")).not.toBeInTheDocument();
    expect(screen.getByText("Facilities:")).toBeInTheDocument();
  });

  it("renders nothing when every sub-status is null", () => {
    const { container } = render(
      <SubStatusList payrollStatus={null} itStatus={null} facilitiesStatus={null} />
    );
    expect(container).toBeEmptyDOMElement();
  });
});
