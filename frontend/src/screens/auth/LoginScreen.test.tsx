import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { LoginScreen } from "@/screens/auth/LoginScreen";

const replace = vi.fn();
const mutate = vi.fn();
let mutationState: { isPending: boolean } = { isPending: false };

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace }),
}));

vi.mock("@/features/auth/auth.mutations", () => ({
  useLoginMutation: () => ({ mutate, isPending: mutationState.isPending }),
}));

describe("LoginScreen", () => {
  beforeEach(() => {
    replace.mockClear();
    mutate.mockClear();
    mutationState = { isPending: false };
  });

  it("shows inline validation errors and does not call mutate when fields are empty", async () => {
    const user = userEvent.setup();
    render(<LoginScreen />);

    await user.click(screen.getByRole("button", { name: /sign in/i }));

    expect(await screen.findByText("Email is required.")).toBeInTheDocument();
    expect(screen.getByText("Password is required.")).toBeInTheDocument();
    expect(mutate).not.toHaveBeenCalled();
  });

  it("submits email/password and redirects to /change-password when mustChangePassword is true", async () => {
    const user = userEvent.setup();
    mutate.mockImplementation((_payload, { onSuccess }) => {
      onSuccess({
        token: "t",
        employee: { roleCategory: null, mustChangePassword: true },
      });
    });
    render(<LoginScreen />);

    await user.type(screen.getByLabelText("Email"), "employee@example.com");
    await user.type(screen.getByLabelText("Password"), "secret");
    await user.click(screen.getByRole("button", { name: /sign in/i }));

    expect(mutate).toHaveBeenCalledWith(
      { email: "employee@example.com", password: "secret" },
      expect.any(Object)
    );
    expect(replace).toHaveBeenCalledWith("/change-password");
  });

  it("redirects via roleLandingPath when mustChangePassword is false", async () => {
    const user = userEvent.setup();
    mutate.mockImplementation((_payload, { onSuccess }) => {
      onSuccess({
        token: "t",
        employee: { roleCategory: "Payroll", mustChangePassword: false },
      });
    });
    render(<LoginScreen />);

    await user.type(screen.getByLabelText("Email"), "payroll@example.com");
    await user.type(screen.getByLabelText("Password"), "secret");
    await user.click(screen.getByRole("button", { name: /sign in/i }));

    expect(replace).toHaveBeenCalledWith("/approvals");
  });

  it("shows a generic incorrect-credentials message on a 401", async () => {
    const user = userEvent.setup();
    mutate.mockImplementation((_payload, { onError }) => {
      onError({ isAxiosError: true, response: { status: 401, data: { error: { code: "INVALID_CREDENTIALS" } } } });
    });
    render(<LoginScreen />);

    await user.type(screen.getByLabelText("Email"), "wrong@example.com");
    await user.type(screen.getByLabelText("Password"), "wrong");
    await user.click(screen.getByRole("button", { name: /sign in/i }));

    expect(await screen.findByText("Incorrect email or password.")).toBeInTheDocument();
  });

  it("shows an inactive-account message on a 403", async () => {
    const user = userEvent.setup();
    mutate.mockImplementation((_payload, { onError }) => {
      onError({ isAxiosError: true, response: { status: 403, data: { error: { code: "ACCOUNT_INACTIVE" } } } });
    });
    render(<LoginScreen />);

    await user.type(screen.getByLabelText("Email"), "inactive@example.com");
    await user.type(screen.getByLabelText("Password"), "secret");
    await user.click(screen.getByRole("button", { name: /sign in/i }));

    expect(await screen.findByText(/account is inactive/i)).toBeInTheDocument();
  });
});
