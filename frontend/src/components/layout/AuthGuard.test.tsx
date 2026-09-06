import { render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { AuthGuard } from "@/components/layout/AuthGuard";
import { useAuthStore } from "@/features/auth/auth.store";

const replace = vi.fn();
let currentPathname = "/transfer-request";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace }),
  usePathname: () => currentPathname,
}));

function setHydrated(overrides: Partial<ReturnType<typeof useAuthStore.getState>> = {}) {
  useAuthStore.setState({ hasHydrated: true, ...overrides });
}

describe("AuthGuard", () => {
  afterEach(() => {
    replace.mockClear();
    currentPathname = "/transfer-request";
    useAuthStore.getState().clearSession();
    useAuthStore.setState({ hasHydrated: false });
  });

  it("redirects an unauthenticated visitor to /login and renders nothing", async () => {
    setHydrated({ token: null, employee: null });

    render(
      <AuthGuard>
        <div>Protected content</div>
      </AuthGuard>
    );

    await waitFor(() => expect(replace).toHaveBeenCalledWith("/login"));
    expect(screen.queryByText("Protected content")).not.toBeInTheDocument();
  });

  it("renders children for an authenticated user with no pending password change", () => {
    setHydrated({
      token: "t",
      employee: {
        id: "e1",
        name: "Test",
        email: "test@example.com",
        locationId: "l1",
        departmentId: "d1",
        roleId: "r1",
        roleCategory: null,
        managerId: null,
        hrId: null,
        mustChangePassword: false,
      },
    });

    render(
      <AuthGuard>
        <div>Protected content</div>
      </AuthGuard>
    );

    expect(screen.getByText("Protected content")).toBeInTheDocument();
    expect(replace).not.toHaveBeenCalled();
  });

  it("redirects to /change-password whenever mustChangePassword is true, regardless of route", async () => {
    currentPathname = "/transfer-request";
    setHydrated({
      token: "t",
      employee: {
        id: "e1",
        name: "Test",
        email: "test@example.com",
        locationId: "l1",
        departmentId: "d1",
        roleId: "r1",
        roleCategory: null,
        managerId: null,
        hrId: null,
        mustChangePassword: true,
      },
    });

    render(
      <AuthGuard>
        <div>Protected content</div>
      </AuthGuard>
    );

    await waitFor(() => expect(replace).toHaveBeenCalledWith("/change-password"));
    expect(screen.queryByText("Protected content")).not.toBeInTheDocument();
  });

  it("does not redirect an unauthenticated visitor already on /login", () => {
    currentPathname = "/login";
    setHydrated({ token: null, employee: null });

    render(
      <AuthGuard>
        <div>Login form</div>
      </AuthGuard>
    );

    expect(screen.getByText("Login form")).toBeInTheDocument();
    expect(replace).not.toHaveBeenCalled();
  });

  it("renders /login immediately even before the persisted store has hydrated", () => {
    currentPathname = "/login";
    useAuthStore.setState({ hasHydrated: false, token: null, employee: null });

    render(
      <AuthGuard>
        <div>Login form</div>
      </AuthGuard>
    );

    expect(screen.getByText("Login form")).toBeInTheDocument();
    expect(replace).not.toHaveBeenCalled();
  });

  it("renders nothing on a protected route before the persisted store has hydrated", () => {
    currentPathname = "/transfer-request";
    useAuthStore.setState({ hasHydrated: false, token: null, employee: null });

    render(
      <AuthGuard>
        <div>Protected content</div>
      </AuthGuard>
    );

    expect(screen.queryByText("Protected content")).not.toBeInTheDocument();
    expect(replace).not.toHaveBeenCalled();
  });
});
