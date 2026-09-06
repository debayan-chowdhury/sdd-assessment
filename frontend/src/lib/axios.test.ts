import { AxiosError, AxiosHeaders } from "axios";
import { afterEach, describe, expect, it, vi } from "vitest";
import { useAuthStore } from "@/features/auth/auth.store";
import { attachBearerToken, handleUnauthorizedResponse } from "@/lib/axios";

const testEmployee = {
  id: "e1",
  name: "Test Employee",
  email: "test@example.com",
  locationId: "l1",
  departmentId: "d1",
  roleId: "r1",
  roleCategory: null,
  managerId: null,
  hrId: null,
  mustChangePassword: false,
} as const;

describe("attachBearerToken", () => {
  afterEach(() => {
    useAuthStore.getState().clearSession();
  });

  it("attaches the stored token as a Bearer header", () => {
    useAuthStore.getState().setSession("abc123", testEmployee);

    const config = attachBearerToken({ headers: new AxiosHeaders() } as never);

    expect(config.headers.get("Authorization")).toBe("Bearer abc123");
  });

  it("does not set an Authorization header when there is no token", () => {
    const config = attachBearerToken({ headers: new AxiosHeaders() } as never);

    expect(config.headers.get("Authorization")).toBeUndefined();
  });
});

describe("handleUnauthorizedResponse", () => {
  afterEach(() => {
    useAuthStore.getState().clearSession();
    vi.restoreAllMocks();
  });

  it("clears the session on a 401 response (AuthGuard reacts to the token going null)", async () => {
    useAuthStore.getState().setSession("stale-token", testEmployee);

    const error = new AxiosError("Unauthorized", "401", undefined, undefined, {
      status: 401,
      data: {},
      statusText: "Unauthorized",
      headers: {},
      config: {} as never,
    });

    await expect(handleUnauthorizedResponse(error)).rejects.toBe(error);
    expect(useAuthStore.getState().token).toBeNull();
    expect(useAuthStore.getState().employee).toBeNull();
  });

  it("leaves the session untouched for a non-401 error", async () => {
    useAuthStore.getState().setSession("still-valid", testEmployee);
    const error = new AxiosError("Not Found", "404", undefined, undefined, {
      status: 404,
      data: {},
      statusText: "Not Found",
      headers: {},
      config: {} as never,
    });

    await expect(handleUnauthorizedResponse(error)).rejects.toBe(error);
    expect(useAuthStore.getState().token).toBe("still-valid");
  });
});
