import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { NewTransferRequestScreen } from "@/screens/transfer-request/NewTransferRequestScreen";

const replace = vi.fn();
const mutate = vi.fn();
const refetchOptions = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace }),
}));

vi.mock("@/features/transfer-request/transfer-request.mutations", () => ({
  useSubmitTransferRequest: () => ({ mutate, isPending: false }),
}));

vi.mock("@/features/transfer-request/useTransferRequestOptions", () => ({
  useTransferRequestOptions: () => ({
    locations: [
      { id: "loc-1", name: "Delhi" },
      { id: "loc-2", name: "Mumbai" },
    ],
    departments: [{ id: "dept-1", name: "Finance" }],
    roles: [{ id: "role-1", name: "Analyst" }],
    isLoading: false,
    refetch: refetchOptions,
  }),
}));

function futureDateString(daysFromNow: number): string {
  const date = new Date();
  date.setDate(date.getDate() + daysFromNow);
  return date.toISOString().slice(0, 10);
}

async function fillValidSelections(user: ReturnType<typeof userEvent.setup>) {
  await user.selectOptions(screen.getByLabelText("Location"), "loc-1");
  await user.selectOptions(screen.getByLabelText("Department"), "dept-1");
  await user.selectOptions(screen.getByLabelText("Role"), "role-1");
}

describe("NewTransferRequestScreen", () => {
  beforeEach(() => {
    replace.mockClear();
    mutate.mockClear();
    refetchOptions.mockClear();
  });

  it("disables the Department select until a Location is chosen, then enables it", async () => {
    const user = userEvent.setup();
    render(<NewTransferRequestScreen />);

    expect(screen.getByLabelText("Department")).toBeDisabled();

    await user.selectOptions(screen.getByLabelText("Location"), "loc-1");

    expect(screen.getByLabelText("Department")).toBeEnabled();
  });

  it("resets the selected Department when the Location changes", async () => {
    const user = userEvent.setup();
    render(<NewTransferRequestScreen />);

    await user.selectOptions(screen.getByLabelText("Location"), "loc-1");
    await user.selectOptions(screen.getByLabelText("Department"), "dept-1");
    expect(screen.getByLabelText("Department")).toHaveValue("dept-1");

    await user.selectOptions(screen.getByLabelText("Location"), "loc-2");
    expect(screen.getByLabelText("Department")).toHaveValue("");
  });

  it("shows inline validation errors for every required field when submitted empty", async () => {
    const user = userEvent.setup();
    render(<NewTransferRequestScreen />);

    await user.click(screen.getByRole("button", { name: /submit request/i }));

    expect(await screen.findByText("Location is required.")).toBeInTheDocument();
    expect(screen.getByText("Department is required.")).toBeInTheDocument();
    expect(screen.getByText("Role is required.")).toBeInTheDocument();
    expect(screen.getByText("Effective date is required.")).toBeInTheDocument();
    expect(mutate).not.toHaveBeenCalled();
  });

  it("blocks submission client-side when the effective date is fewer than 30 days out", async () => {
    const user = userEvent.setup();
    render(<NewTransferRequestScreen />);

    await fillValidSelections(user);
    const dateInput = screen.getByLabelText("Effective date");
    fireEvent.change(dateInput, { target: { value: futureDateString(10) } });
    await user.click(screen.getByRole("button", { name: /submit request/i }));

    expect(await screen.findByText(/at least 30 days/)).toBeInTheDocument();
    expect(mutate).not.toHaveBeenCalled();
  });

  it("submits and redirects to the new request's status view on success", async () => {
    const user = userEvent.setup();
    mutate.mockImplementation((_payload, { onSuccess }) => onSuccess({ id: "tr-1" }));
    render(<NewTransferRequestScreen />);

    await fillValidSelections(user);
    const dateInput = screen.getByLabelText("Effective date");
    fireEvent.change(dateInput, { target: { value: futureDateString(45) } });
    await user.click(screen.getByRole("button", { name: /submit request/i }));

    expect(mutate).toHaveBeenCalledWith(
      expect.objectContaining({ newLocationId: "loc-1", newDepartmentId: "dept-1", newRoleId: "role-1" }),
      expect.any(Object)
    );
    expect(replace).toHaveBeenCalledWith("/transfer-request/tr-1");
  });

  it("shows a re-select message and refetches option lists on NOT_FOUND", async () => {
    const user = userEvent.setup();
    mutate.mockImplementation((_payload, { onError }) => {
      onError({
        isAxiosError: true,
        response: { status: 404, data: { error: { code: "NOT_FOUND" } } },
      });
    });
    render(<NewTransferRequestScreen />);

    await fillValidSelections(user);
    const dateInput = screen.getByLabelText("Effective date");
    fireEvent.change(dateInput, { target: { value: futureDateString(45) } });
    await user.click(screen.getByRole("button", { name: /submit request/i }));

    expect(await screen.findByText(/no longer available/)).toBeInTheDocument();
    expect(refetchOptions).toHaveBeenCalled();
  });

  it("shows a message directing to the active request on ACTIVE_REQUEST_EXISTS", async () => {
    const user = userEvent.setup();
    mutate.mockImplementation((_payload, { onError }) => {
      onError({
        isAxiosError: true,
        response: { status: 409, data: { error: { code: "ACTIVE_REQUEST_EXISTS" } } },
      });
    });
    render(<NewTransferRequestScreen />);

    await fillValidSelections(user);
    const dateInput = screen.getByLabelText("Effective date");
    fireEvent.change(dateInput, { target: { value: futureDateString(45) } });
    await user.click(screen.getByRole("button", { name: /submit request/i }));

    expect(await screen.findByText(/already have an active request/)).toBeInTheDocument();
  });

  it("shows a message on NO_CHANGE_REQUESTED (same location and department as current)", async () => {
    const user = userEvent.setup();
    mutate.mockImplementation((_payload, { onError }) => {
      onError({
        isAxiosError: true,
        response: { status: 400, data: { error: { code: "NO_CHANGE_REQUESTED" } } },
      });
    });
    render(<NewTransferRequestScreen />);

    await fillValidSelections(user);
    const dateInput = screen.getByLabelText("Effective date");
    fireEvent.change(dateInput, { target: { value: futureDateString(45) } });
    await user.click(screen.getByRole("button", { name: /submit request/i }));

    expect(await screen.findByText(/already in this location, department, and role/)).toBeInTheDocument();
  });

  it("shows an inline Role error and refetches options on ROLE_CATEGORY_NOT_ALLOWED", async () => {
    const user = userEvent.setup();
    mutate.mockImplementation((_payload, { onError }) => {
      onError({
        isAxiosError: true,
        response: { status: 400, data: { error: { code: "ROLE_CATEGORY_NOT_ALLOWED" } } },
      });
    });
    render(<NewTransferRequestScreen />);

    await fillValidSelections(user);
    const dateInput = screen.getByLabelText("Effective date");
    fireEvent.change(dateInput, { target: { value: futureDateString(45) } });
    await user.click(screen.getByRole("button", { name: /submit request/i }));

    expect(await screen.findByText(/isn't available for self-service transfer/)).toBeInTheDocument();
    expect(refetchOptions).toHaveBeenCalled();
  });
});
