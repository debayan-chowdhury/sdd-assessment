import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ApprovalsInboxScreen } from "@/screens/approvals/ApprovalsInboxScreen";

const useAuthStoreState = vi.fn();

vi.mock("@/features/auth/auth.store", () => ({
  useAuthStore: (selector: (state: unknown) => unknown) => selector(useAuthStoreState()),
}));

vi.mock("@/screens/approvals/CurrentManagerQueue", () => ({
  CurrentManagerQueue: () => <div>stub:CurrentManagerQueue</div>,
}));
vi.mock("@/screens/approvals/CurrentHrQueue", () => ({ CurrentHrQueue: () => <div>stub:CurrentHrQueue</div> }));
vi.mock("@/screens/approvals/ReceivingHrGateQueue", () => ({
  ReceivingHrGateQueue: () => <div>stub:ReceivingHrGateQueue</div>,
}));
vi.mock("@/screens/approvals/ReceivingHrFulfillmentQueue", () => ({
  ReceivingHrFulfillmentQueue: () => <div>stub:ReceivingHrFulfillmentQueue</div>,
}));
vi.mock("@/screens/approvals/ReceivingHrHoldReopen", () => ({
  ReceivingHrHoldReopen: () => <div>stub:ReceivingHrHoldReopen</div>,
}));
vi.mock("@/screens/approvals/ReceivingManagerQueue", () => ({
  ReceivingManagerQueue: () => <div>stub:ReceivingManagerQueue</div>,
}));
vi.mock("@/screens/approvals/PayrollWorklist", () => ({ PayrollWorklist: () => <div>stub:PayrollWorklist</div> }));
vi.mock("@/screens/approvals/ItWorklist", () => ({ ItWorklist: () => <div>stub:ItWorklist</div> }));
vi.mock("@/screens/approvals/FacilitiesWorklist", () => ({
  FacilitiesWorklist: () => <div>stub:FacilitiesWorklist</div>,
}));

describe("ApprovalsInboxScreen", () => {
  it("shows a fallback message for a plain Employee, with none of the queue sections mounted", () => {
    useAuthStoreState.mockReturnValue({ employee: { roleCategory: null } });

    render(<ApprovalsInboxScreen />);

    expect(screen.getByText("You don't have any approvals to review.")).toBeInTheDocument();
    expect(screen.queryByText("stub:CurrentManagerQueue")).not.toBeInTheDocument();
    expect(screen.queryByText("stub:PayrollWorklist")).not.toBeInTheDocument();
  });

  it("mounts every queue section for a role that holds one (each section self-gates further)", () => {
    useAuthStoreState.mockReturnValue({ employee: { roleCategory: "Manager" } });

    render(<ApprovalsInboxScreen />);

    expect(screen.queryByText("You don't have any approvals to review.")).not.toBeInTheDocument();
    expect(screen.getByText("stub:CurrentManagerQueue")).toBeInTheDocument();
    expect(screen.getByText("stub:ReceivingManagerQueue")).toBeInTheDocument();
  });
});
