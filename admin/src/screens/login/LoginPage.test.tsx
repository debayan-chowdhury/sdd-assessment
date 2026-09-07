import { afterEach, describe, expect, it } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import MockAdapter from "axios-mock-adapter";
import { LoginPage } from "./LoginPage";
import { renderWithClient } from "@/test/render";
import { api } from "@/lib/axios";
import { useAuthStore } from "@/features/auth/auth.store";

// admin-static-login.spec.md — Unit Test Cases UT03, UT04, UT05.
const mock = new MockAdapter(api);

afterEach(() => {
  mock.reset();
  useAuthStore.setState({ token: null, admin: null, isAuthenticated: false });
});

async function submitLogin(username: string, password: string) {
  const user = userEvent.setup();
  if (username) await user.type(screen.getByLabelText("Username"), username);
  if (password) await user.type(screen.getByLabelText("Password"), password);
  await user.click(screen.getByRole("button", { name: /sign in/i }));
}

describe("LoginPage", () => {
  // UT03: Submit admin/admin -> Token + profile stored, redirect fires
  it("stores the token and admin profile on a successful login", async () => {
    const admin = { name: "Admin", email: "admin@example.com", phone: "000" };
    mock.onPost("/admin/login", { username: "admin", password: "admin" }).reply(200, {
      token: "jwt-token",
      admin,
    });

    renderWithClient(<LoginPage />);
    await submitLogin("admin", "admin");

    await waitFor(() => {
      expect(useAuthStore.getState().isAuthenticated).toBe(true);
    });
    expect(useAuthStore.getState().token).toBe("jwt-token");
    expect(useAuthStore.getState().admin).toEqual(admin);
  });

  // UT04: Submit admin/wrongpass -> INVALID_CREDENTIALS message rendered, no redirect
  it("shows an inline error and does not store a session on invalid credentials", async () => {
    mock.onPost("/admin/login").reply(401, {
      error: { code: "INVALID_CREDENTIALS", message: "Invalid username or password." },
    });

    renderWithClient(<LoginPage />);
    await submitLogin("admin", "wrongpass");

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Invalid username or password.",
    );
    expect(useAuthStore.getState().isAuthenticated).toBe(false);
  });

  // UT05: Submit with password empty -> VALIDATION_ERROR message rendered, no redirect
  it("shows an inline error and does not store a session on validation failure", async () => {
    mock.onPost("/admin/login").reply(400, {
      error: { code: "VALIDATION_ERROR", message: "Username and password are required." },
    });

    renderWithClient(<LoginPage />);
    await submitLogin("admin", "");

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Username and password are required.",
    );
    expect(useAuthStore.getState().isAuthenticated).toBe(false);
  });
});
