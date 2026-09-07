import { afterEach, describe, expect, it, vi } from "vitest";
import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import MockAdapter from "axios-mock-adapter";
import { LocationDetailPage } from "./LocationDetailPage";
import { renderWithClient } from "@/test/render";
import { api } from "@/lib/axios";

// location-crud.spec.md — Unit Test Cases UT06, UT07, UT08, UT09, UT10, UT11,
// UT15, UT16.

const push = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push, replace: vi.fn() }),
  usePathname: () => "/locations/loc1",
}));

const mock = new MockAdapter(api);

afterEach(() => {
  mock.reset();
  push.mockClear();
});

describe("LocationDetailPage", () => {
  // UT06: Open detail screen for existing Location -> fields + mapped Departments populated
  it("UT06: shows the location's name, code, status, and mapped departments", async () => {
    mock
      .onGet("/locations/loc1")
      .reply(200, { _id: "loc1", name: "HQ", code: "HQ1", isActive: true });
    mock
      .onGet("/locations/loc1/departments")
      .reply(200, [{ _id: "d1", name: "Sales", code: "SAL", isActive: true }]);
    mock.onGet("/departments", { params: {} }).reply(200, []);

    renderWithClient(<LocationDetailPage locationId="loc1" />);

    expect(await screen.findByRole("heading", { name: "HQ" })).toBeInTheDocument();
    expect(screen.getByText("HQ1")).toBeInTheDocument();
    expect(screen.getByText("Active")).toBeInTheDocument();
    expect(await screen.findByText("Sales (SAL)")).toBeInTheDocument();
  });

  // UT07: Submit edit form with new name/code -> row/detail reflects update
  it("UT07: updates the detail view after editing name and code", async () => {
    let current = { _id: "loc1", name: "HQ", code: "HQ1", isActive: true };
    mock.onGet("/locations/loc1").reply(() => [200, current]);
    mock.onGet("/locations/loc1/departments").reply(200, []);
    mock.onGet("/departments", { params: {} }).reply(200, []);
    mock.onPut("/locations/loc1").reply((config) => {
      const body = JSON.parse(config.data);
      current = { ...current, name: body.name, code: body.code };
      return [200, current];
    });

    renderWithClient(<LocationDetailPage locationId="loc1" />);
    await screen.findByRole("heading", { name: "HQ" });

    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: "Edit" }));

    const nameInput = screen.getByLabelText("Name");
    const codeInput = screen.getByLabelText("Code");
    await user.clear(nameInput);
    await user.type(nameInput, "Headquarters");
    await user.clear(codeInput);
    await user.type(codeInput, "HQ2");
    await user.click(screen.getByRole("button", { name: "Save" }));

    expect(await screen.findByRole("heading", { name: "Headquarters" })).toBeInTheDocument();
    expect(screen.getByText("HQ2")).toBeInTheDocument();
  });

  // UT08: Submit edit form with a duplicate code -> inline DUPLICATE_CODE, no update
  it("UT08: shows an inline duplicate-code error and leaves the location unchanged", async () => {
    const current = { _id: "loc1", name: "HQ", code: "HQ1", isActive: true };
    mock.onGet("/locations/loc1").reply(200, current);
    mock.onGet("/locations/loc1/departments").reply(200, []);
    mock.onGet("/departments", { params: {} }).reply(200, []);
    mock.onPut("/locations/loc1").reply(409, {
      error: { code: "DUPLICATE_CODE", message: "Code already in use." },
    });

    renderWithClient(<LocationDetailPage locationId="loc1" />);
    await screen.findByRole("heading", { name: "HQ" });

    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: "Edit" }));
    const codeInput = screen.getByLabelText("Code");
    await user.clear(codeInput);
    await user.type(codeInput, "TAKEN");
    await user.click(screen.getByRole("button", { name: "Save" }));

    expect(
      await screen.findByText("This code is already in use."),
    ).toBeInTheDocument();
    // Detail view still shows the original, unchanged values.
    expect(screen.getByRole("heading", { name: "HQ" })).toBeInTheDocument();
    expect(screen.getByText("HQ1")).toBeInTheDocument();
  });

  // UT09: Deactivate Location with no mapped Employees -> status becomes inactive
  it("UT09: deactivates a location with no mapped employees", async () => {
    let current = { _id: "loc1", name: "HQ", code: "HQ1", isActive: true };
    mock.onGet("/locations/loc1").reply(() => [200, current]);
    mock.onGet("/locations/loc1/departments").reply(200, []);
    mock.onGet("/departments", { params: {} }).reply(200, []);
    mock.onPatch("/locations/loc1/status").reply((config) => {
      const body = JSON.parse(config.data);
      current = { ...current, isActive: body.isActive };
      return [200, current];
    });

    renderWithClient(<LocationDetailPage locationId="loc1" />);
    await screen.findByRole("heading", { name: "HQ" });
    expect(screen.getByText("Active")).toBeInTheDocument();

    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: "Deactivate" }));
    const dialog = await screen.findByRole("dialog", { name: "Deactivate Location" });
    await user.click(within(dialog).getByRole("button", { name: "Deactivate" }));

    await waitFor(() => {
      expect(screen.getByText("Inactive")).toBeInTheDocument();
    });
  });

  // UT10: Deactivate Location with a mapped active Employee -> LOCATION_HAS_ACTIVE_EMPLOYEES shown, status unchanged
  it("UT10: shows a blocking error and leaves status unchanged when active employees are mapped", async () => {
    const current = { _id: "loc1", name: "HQ", code: "HQ1", isActive: true };
    mock.onGet("/locations/loc1").reply(200, current);
    mock.onGet("/locations/loc1/departments").reply(200, []);
    mock.onGet("/departments", { params: {} }).reply(200, []);
    mock.onPatch("/locations/loc1/status").reply(409, {
      error: {
        code: "LOCATION_HAS_ACTIVE_EMPLOYEES",
        message: "Location has active employees.",
      },
    });

    renderWithClient(<LocationDetailPage locationId="loc1" />);
    await screen.findByRole("heading", { name: "HQ" });

    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: "Deactivate" }));
    const dialog = await screen.findByRole("dialog", { name: "Deactivate Location" });
    await user.click(within(dialog).getByRole("button", { name: "Deactivate" }));

    expect(
      await screen.findByText(
        "This location has active employees mapped to it and cannot be deactivated.",
      ),
    ).toBeInTheDocument();
    expect(screen.getByText("Active")).toBeInTheDocument();
  });

  // UT11: Reactivate an inactive Location -> status becomes active
  it("UT11: reactivates an inactive location", async () => {
    let current = { _id: "loc1", name: "HQ", code: "HQ1", isActive: false };
    mock.onGet("/locations/loc1").reply(() => [200, current]);
    mock.onGet("/locations/loc1/departments").reply(200, []);
    mock.onGet("/departments", { params: {} }).reply(200, []);
    mock.onPatch("/locations/loc1/status").reply((config) => {
      const body = JSON.parse(config.data);
      current = { ...current, isActive: body.isActive };
      return [200, current];
    });

    renderWithClient(<LocationDetailPage locationId="loc1" />);
    await screen.findByRole("heading", { name: "HQ" });
    expect(screen.getByText("Inactive")).toBeInTheDocument();

    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: "Reactivate" }));

    await waitFor(() => {
      expect(screen.getByText("Active")).toBeInTheDocument();
    });
  });

  // UT15: Delete a Location with no mapped Employees, confirm dialog -> Location gone, redirected to list
  it("UT15: deletes the location and redirects to the list when there are no mapped employees", async () => {
    const current = { _id: "loc1", name: "HQ", code: "HQ1", isActive: true };
    mock.onGet("/locations/loc1").reply(200, current);
    mock.onGet("/locations/loc1/departments").reply(200, []);
    mock.onGet("/departments", { params: {} }).reply(200, []);
    mock.onDelete("/locations/loc1").reply(200);

    renderWithClient(<LocationDetailPage locationId="loc1" />);
    await screen.findByRole("heading", { name: "HQ" });

    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: "Delete" }));
    const dialog = await screen.findByRole("dialog", { name: "Delete Location" });
    await user.click(within(dialog).getByRole("button", { name: "Delete" }));

    await waitFor(() => {
      expect(push).toHaveBeenCalledWith("/locations");
    });
  });

  // UT16: Delete a Location with a mapped Employee -> LOCATION_HAS_EMPLOYEES shown
  it("UT16: shows a blocking error and does not redirect when employees are mapped", async () => {
    const current = { _id: "loc1", name: "HQ", code: "HQ1", isActive: true };
    mock.onGet("/locations/loc1").reply(200, current);
    mock.onGet("/locations/loc1/departments").reply(200, []);
    mock.onGet("/departments", { params: {} }).reply(200, []);
    mock.onDelete("/locations/loc1").reply(409, {
      error: { code: "LOCATION_HAS_EMPLOYEES", message: "Location has employees." },
    });

    renderWithClient(<LocationDetailPage locationId="loc1" />);
    await screen.findByRole("heading", { name: "HQ" });

    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: "Delete" }));
    const dialog = await screen.findByRole("dialog", { name: "Delete Location" });
    await user.click(within(dialog).getByRole("button", { name: "Delete" }));

    expect(
      await screen.findByText(
        "This location has employees mapped to it and cannot be deleted.",
      ),
    ).toBeInTheDocument();
    expect(push).not.toHaveBeenCalled();
  });
});
