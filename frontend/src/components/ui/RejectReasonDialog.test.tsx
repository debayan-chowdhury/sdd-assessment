import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { RejectReasonDialog } from "@/components/ui/RejectReasonDialog";

describe("RejectReasonDialog", () => {
  it("shows a Reject trigger before it's opened", () => {
    render(<RejectReasonDialog onConfirm={vi.fn()} />);
    expect(screen.getByRole("button", { name: "Reject" })).toBeInTheDocument();
    expect(screen.queryByLabelText(/Reason/)).not.toBeInTheDocument();
  });

  it("mandatory mode: blocks submit with an empty reason and shows an inline error", async () => {
    const user = userEvent.setup();
    const onConfirm = vi.fn();
    render(<RejectReasonDialog onConfirm={onConfirm} />);

    await user.click(screen.getByRole("button", { name: "Reject" }));
    await user.click(screen.getByRole("button", { name: "Confirm reject" }));

    expect(screen.getByText("A reason is required.")).toBeInTheDocument();
    expect(onConfirm).not.toHaveBeenCalled();
  });

  it("mandatory mode: submits the trimmed reason once provided", async () => {
    const user = userEvent.setup();
    const onConfirm = vi.fn();
    render(<RejectReasonDialog onConfirm={onConfirm} />);

    await user.click(screen.getByRole("button", { name: "Reject" }));
    await user.type(screen.getByLabelText("Reason"), "  Not a fit  ");
    await user.click(screen.getByRole("button", { name: "Confirm reject" }));

    expect(onConfirm).toHaveBeenCalledWith("Not a fit");
  });

  it("optional mode: submits successfully with an empty reason", async () => {
    const user = userEvent.setup();
    const onConfirm = vi.fn();
    render(<RejectReasonDialog onConfirm={onConfirm} reasonRequired={false} />);

    await user.click(screen.getByRole("button", { name: "Reject" }));
    await user.click(screen.getByRole("button", { name: "Confirm reject" }));

    expect(onConfirm).toHaveBeenCalledWith("");
  });

  it("cancel closes the panel without confirming", async () => {
    const user = userEvent.setup();
    const onConfirm = vi.fn();
    render(<RejectReasonDialog onConfirm={onConfirm} />);

    await user.click(screen.getByRole("button", { name: "Reject" }));
    await user.click(screen.getByRole("button", { name: "Cancel" }));

    expect(screen.getByRole("button", { name: "Reject" })).toBeInTheDocument();
    expect(onConfirm).not.toHaveBeenCalled();
  });
});
