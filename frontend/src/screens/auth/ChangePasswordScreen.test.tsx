import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ChangePasswordScreen } from "@/screens/auth/ChangePasswordScreen";

const replace = vi.fn();
const mutate = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace }),
}));

vi.mock("@/features/auth/auth.mutations", () => ({
  useChangePasswordMutation: () => ({ mutate, isPending: false }),
}));

vi.mock("@/features/auth/auth.store", () => ({
  useAuthStore: (selector: (state: { employee: { roleCategory: null } }) => unknown) =>
    selector({ employee: { roleCategory: null } }),
}));

describe("ChangePasswordScreen", () => {
  beforeEach(() => {
    replace.mockClear();
    mutate.mockClear();
  });

  it("blocks submission with no complexity rule, only presence validation", async () => {
    const user = userEvent.setup();
    render(<ChangePasswordScreen />);

    await user.click(screen.getByRole("button", { name: /update password/i }));

    expect(await screen.findByText("Current password is required.")).toBeInTheDocument();
    expect(screen.getByText("New password is required.")).toBeInTheDocument();
    expect(mutate).not.toHaveBeenCalled();
  });

  it("submits, redirects on success, and does not enforce any password strength rule", async () => {
    const user = userEvent.setup();
    mutate.mockImplementation((_payload, { onSuccess }) => onSuccess());
    render(<ChangePasswordScreen />);

    await user.type(screen.getByLabelText("Current password"), "old");
    await user.type(screen.getByLabelText("New password"), "a");
    await user.click(screen.getByRole("button", { name: /update password/i }));

    expect(mutate).toHaveBeenCalledWith({ currentPassword: "old", newPassword: "a" }, expect.any(Object));
    expect(replace).toHaveBeenCalledWith("/transfer-request");
  });

  it("shows an inline field error on INVALID_CURRENT_PASSWORD and does not clear the form", async () => {
    const user = userEvent.setup();
    mutate.mockImplementation((_payload, { onError }) => {
      onError({ isAxiosError: true, response: { status: 400, data: { error: { code: "INVALID_CURRENT_PASSWORD" } } } });
    });
    render(<ChangePasswordScreen />);

    await user.type(screen.getByLabelText("Current password"), "wrong");
    await user.type(screen.getByLabelText("New password"), "newpass");
    await user.click(screen.getByRole("button", { name: /update password/i }));

    expect(await screen.findByText("Current password is incorrect.")).toBeInTheDocument();
    expect(screen.getByLabelText("New password")).toHaveValue("newpass");
  });
});
