import { afterEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { AuthGuard } from "./AuthGuard";
import { useAuthStore } from "@/features/auth/auth.store";

// admin-static-login.spec.md — Unit Test Cases UT01, UT02, and the redirect
// half of UT06 (store-clearing half is covered by src/lib/axios.test.ts).
const replace = vi.fn();
let pathname = "/locations";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace }),
  usePathname: () => pathname,
}));

afterEach(() => {
  replace.mockClear();
  pathname = "/locations";
  useAuthStore.setState({
    token: null,
    admin: null,
    isAuthenticated: false,
    hasHydrated: false,
  });
});

describe("AuthGuard", () => {
  // UT01: Visit /locations with no token in the store -> redirected to /login
  it("redirects to /login when unauthenticated on a protected path", async () => {
    pathname = "/locations";
    useAuthStore.setState({ isAuthenticated: false, hasHydrated: true });

    render(
      <AuthGuard>
        <p>Protected content</p>
      </AuthGuard>,
    );

    await waitFor(() => expect(replace).toHaveBeenCalledWith("/login"));
    expect(screen.queryByText("Protected content")).not.toBeInTheDocument();
  });

  // UT02: Visit /login with a token already in the store -> redirected away from /login
  it("redirects away from /login when already authenticated", async () => {
    pathname = "/login";
    useAuthStore.setState({ isAuthenticated: true, hasHydrated: true });

    render(
      <AuthGuard>
        <p>Login form</p>
      </AuthGuard>,
    );

    await waitFor(() => expect(replace).toHaveBeenCalledWith("/"));
    expect(screen.queryByText("Login form")).not.toBeInTheDocument();
  });

  // UT06 (redirect half): once isAuthenticated flips to false, AuthGuard
  // reactively redirects to /login without any imperative navigation call.
  it("redirects reactively once isAuthenticated flips to false", async () => {
    pathname = "/locations";
    useAuthStore.setState({ isAuthenticated: true, hasHydrated: true });

    render(
      <AuthGuard>
        <p>Protected content</p>
      </AuthGuard>,
    );
    expect(replace).not.toHaveBeenCalled();

    useAuthStore.getState().logout();

    await waitFor(() => expect(replace).toHaveBeenCalledWith("/login"));
  });

  it("renders nothing until the store has hydrated", () => {
    pathname = "/locations";
    useAuthStore.setState({ isAuthenticated: false, hasHydrated: false });

    render(
      <AuthGuard>
        <p>Protected content</p>
      </AuthGuard>,
    );

    expect(replace).not.toHaveBeenCalled();
    expect(screen.queryByText("Protected content")).not.toBeInTheDocument();
  });

  it("renders children when authenticated on a protected path", () => {
    pathname = "/locations";
    useAuthStore.setState({ isAuthenticated: true, hasHydrated: true });

    render(
      <AuthGuard>
        <p>Protected content</p>
      </AuthGuard>,
    );

    expect(replace).not.toHaveBeenCalled();
    expect(screen.getByText("Protected content")).toBeInTheDocument();
  });
});
