import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it } from "vitest";
import { AppHeader } from "@/components/layout/AppHeader";
import { useAuthStore } from "@/features/auth/auth.store";

describe("AppHeader", () => {
  afterEach(() => {
    useAuthStore.getState().clearSession();
  });

  it("renders nothing when logged out", () => {
    const { container } = render(<AppHeader />);
    expect(container).toBeEmptyDOMElement();
  });

  it("shows a Change password entry, reachable at any time post-login (mustChangePassword: false)", () => {
    useAuthStore.getState().setSession("t", {
      id: "e1",
      name: "Jamie Doe",
      email: "jamie@example.com",
      locationId: "l1",
      departmentId: "d1",
      roleId: "r1",
      roleCategory: null,
      managerId: null,
      hrId: null,
      mustChangePassword: false,
    });

    render(<AppHeader />);

    expect(screen.getByRole("link", { name: "Jamie Doe" })).toHaveAttribute("href", "/profile");
    expect(screen.getByRole("link", { name: /change password/i })).toHaveAttribute(
      "href",
      "/change-password"
    );
  });

  it("links to the dashboard and the transfer-request page, but not Approvals, for a plain Employee", () => {
    useAuthStore.getState().setSession("t", {
      id: "e1",
      name: "Jamie Doe",
      email: "jamie@example.com",
      locationId: "l1",
      departmentId: "d1",
      roleId: "r1",
      roleCategory: null,
      managerId: null,
      hrId: null,
      mustChangePassword: false,
    });

    render(<AppHeader />);

    expect(screen.getByRole("link", { name: "Dashboard" })).toHaveAttribute("href", "/");
    expect(screen.getByRole("link", { name: "Transfer Request" })).toHaveAttribute("href", "/transfer-request");
    expect(screen.queryByRole("link", { name: "Approvals" })).not.toBeInTheDocument();
  });

  it("also links to Approvals for a role that holds any approval/fulfillment queue", () => {
    useAuthStore.getState().setSession("t", {
      id: "e1",
      name: "Jamie Doe",
      email: "jamie@example.com",
      locationId: "l1",
      departmentId: "d1",
      roleId: "r1",
      roleCategory: "Payroll",
      managerId: null,
      hrId: null,
      mustChangePassword: false,
    });

    render(<AppHeader />);

    expect(screen.getByRole("link", { name: "Approvals" })).toHaveAttribute("href", "/approvals");
  });

  it.each(["Manager", "HR"] as const)(
    "hides the Transfer Request nav entry for roleCategory %s (they act on others' requests, not their own)",
    (roleCategory) => {
      useAuthStore.getState().setSession("t", {
        id: "e1",
        name: "Jamie Doe",
        email: "jamie@example.com",
        locationId: "l1",
        departmentId: "d1",
        roleId: "r1",
        roleCategory,
        managerId: null,
        hrId: null,
        mustChangePassword: false,
      });

      render(<AppHeader />);

      expect(screen.queryByRole("link", { name: "Transfer Request" })).not.toBeInTheDocument();
      expect(screen.getByRole("link", { name: "Approvals" })).toBeInTheDocument();
    }
  );

  it.each(["Payroll", "IT", "Facilities", null] as const)(
    "still shows the Transfer Request nav entry for roleCategory %s",
    (roleCategory) => {
      useAuthStore.getState().setSession("t", {
        id: "e1",
        name: "Jamie Doe",
        email: "jamie@example.com",
        locationId: "l1",
        departmentId: "d1",
        roleId: "r1",
        roleCategory,
        managerId: null,
        hrId: null,
        mustChangePassword: false,
      });

      render(<AppHeader />);

      expect(screen.getByRole("link", { name: "Transfer Request" })).toHaveAttribute("href", "/transfer-request");
    }
  );

  it("Log out clears the session, which AuthGuard reacts to for the redirect", async () => {
    useAuthStore.getState().setSession("t", {
      id: "e1",
      name: "Jamie Doe",
      email: "jamie@example.com",
      locationId: "l1",
      departmentId: "d1",
      roleId: "r1",
      roleCategory: null,
      managerId: null,
      hrId: null,
      mustChangePassword: false,
    });
    const user = userEvent.setup();

    render(<AppHeader />);
    await user.click(screen.getByRole("button", { name: "Log out" }));

    expect(useAuthStore.getState().token).toBeNull();
    expect(useAuthStore.getState().employee).toBeNull();
  });
});
