import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { ManagerPicker } from "@/components/ui/ManagerPicker";

const useCandidateManagers = vi.fn();

vi.mock("@/features/transfer-request/transfer-request.queries", () => ({
  useCandidateManagers: (locationId: string, departmentId: string) => useCandidateManagers(locationId, departmentId),
}));

describe("ManagerPicker", () => {
  it("lists candidate managers returned for the given Location+Department", async () => {
    useCandidateManagers.mockReturnValue({
      data: [
        { id: "mgr-1", name: "Alex Manager" },
        { id: "mgr-2", name: "Sam Manager" },
      ],
      isLoading: false,
    });
    const onChange = vi.fn();

    render(<ManagerPicker locationId="loc-1" departmentId="dept-1" value="" onChange={onChange} />);

    const user = userEvent.setup();
    await user.selectOptions(screen.getByLabelText("Receiving Manager"), "mgr-2");

    expect(onChange).toHaveBeenCalledWith("mgr-2");
    expect(useCandidateManagers).toHaveBeenCalledWith("loc-1", "dept-1");
  });

  it("shows a loading placeholder while candidates are being fetched", () => {
    useCandidateManagers.mockReturnValue({ data: undefined, isLoading: true });

    render(<ManagerPicker locationId="loc-1" departmentId="dept-1" value="" onChange={vi.fn()} />);

    expect(screen.getByText("Loading managers…")).toBeInTheDocument();
  });

  it("surfaces a validation error", () => {
    useCandidateManagers.mockReturnValue({ data: [], isLoading: false });

    render(
      <ManagerPicker
        locationId="loc-1"
        departmentId="dept-1"
        value=""
        onChange={vi.fn()}
        error="Select a manager before accepting."
      />
    );

    expect(screen.getByText("Select a manager before accepting.")).toBeInTheDocument();
  });
});
