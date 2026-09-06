import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { ReasonCodeDialog } from "@/components/ui/ReasonCodeDialog";

describe("ReasonCodeDialog", () => {
  it("blocks submit with no reason code selected", async () => {
    const user = userEvent.setup();
    const onConfirm = vi.fn();
    render(<ReasonCodeDialog onConfirm={onConfirm} />);

    await user.click(screen.getByRole("button", { name: "Reject" }));
    await user.click(screen.getByRole("button", { name: "Confirm reject" }));

    expect(screen.getByText("A reason is required.")).toBeInTheDocument();
    expect(onConfirm).not.toHaveBeenCalled();
  });

  it("submits the selected reason code and trimmed detail", async () => {
    const user = userEvent.setup();
    const onConfirm = vi.fn();
    render(<ReasonCodeDialog onConfirm={onConfirm} />);

    await user.click(screen.getByRole("button", { name: "Reject" }));
    await user.selectOptions(screen.getByLabelText("Reason"), "NO_HEADCOUNT");
    await user.type(screen.getByLabelText("Detail (optional)"), "  Budget frozen  ");
    await user.click(screen.getByRole("button", { name: "Confirm reject" }));

    expect(onConfirm).toHaveBeenCalledWith("NO_HEADCOUNT", "Budget frozen");
  });

  it("offers all four reason codes with plain-language labels", async () => {
    const user = userEvent.setup();
    render(<ReasonCodeDialog onConfirm={vi.fn()} />);
    await user.click(screen.getByRole("button", { name: "Reject" }));

    expect(screen.getByRole("option", { name: "No open headcount" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "Role/skill mismatch" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "Timing conflict" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "Other" })).toBeInTheDocument();
  });
});
