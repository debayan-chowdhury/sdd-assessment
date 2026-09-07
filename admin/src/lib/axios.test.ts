import { describe, expect, it, afterEach } from "vitest";
import MockAdapter from "axios-mock-adapter";
import { api } from "./axios";
import { useAuthStore } from "@/features/auth/auth.store";

const mock = new MockAdapter(api);

afterEach(() => {
  mock.reset();
  useAuthStore.setState({
    token: null,
    admin: null,
    isAuthenticated: false,
  });
});

describe("api request interceptor", () => {
  it("attaches Authorization: Bearer <token> when a token is present", async () => {
    useAuthStore.setState({
      token: "test-token",
      admin: { name: "Admin", email: "admin@example.com", phone: "000" },
      isAuthenticated: true,
    });
    mock.onGet("/departments").reply((config) => {
      expect(config.headers?.Authorization).toBe("Bearer test-token");
      return [200, []];
    });

    await api.get("/departments");
  });

  it("sends no Authorization header when there is no token", async () => {
    mock.onGet("/departments").reply((config) => {
      expect(config.headers?.Authorization).toBeUndefined();
      return [200, []];
    });

    await api.get("/departments");
  });
});

describe("api response interceptor", () => {
  it("clears the auth store on a 401 response", async () => {
    useAuthStore.setState({
      token: "test-token",
      admin: { name: "Admin", email: "admin@example.com", phone: "000" },
      isAuthenticated: true,
    });
    mock.onGet("/departments").reply(401, { error: { code: "UNAUTHORIZED", message: "Unauthorized" } });

    await expect(api.get("/departments")).rejects.toBeTruthy();
    expect(useAuthStore.getState().isAuthenticated).toBe(false);
    expect(useAuthStore.getState().token).toBeNull();
  });

  it("leaves the auth store untouched on a non-401 error", async () => {
    useAuthStore.setState({
      token: "test-token",
      admin: { name: "Admin", email: "admin@example.com", phone: "000" },
      isAuthenticated: true,
    });
    mock.onGet("/departments").reply(500, { error: { code: "SERVER_ERROR", message: "Boom" } });

    await expect(api.get("/departments")).rejects.toBeTruthy();
    expect(useAuthStore.getState().isAuthenticated).toBe(true);
  });
});
