import { afterEach, describe, expect, it, vi } from "vitest";
import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import MockAdapter from "axios-mock-adapter";
import { LocationsListPage } from "./LocationsListPage";
import { renderWithClient } from "@/test/render";
import { api } from "@/lib/axios";

// location-crud.spec.md — Unit Test Cases UT01, UT02, UT03, UT04, UT05.

const push = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push, replace: vi.fn() }),
  usePathname: () => "/locations",
}));

const mock = new MockAdapter(api);

afterEach(() => {
  mock.reset();
  push.mockClear();
});

async function openCreateModal() {
  const user = userEvent.setup();
  await user.click(screen.getByRole("button", { name: "Add Location" }));
  return user;
}

describe("LocationsListPage", () => {
  // UT01: Submit create form with valid name/code -> new row rendered, Active badge
  it("UT01: creates a location with valid name/code and shows the new row with an Active badge", async () => {
    let locations = [{ _id: "1", name: "HQ", code: "HQ1", isActive: true }];
    mock.onGet("/locations", { params: {} }).reply(() => [200, locations]);
    mock.onPost("/locations").reply((config) => {
      const body = JSON.parse(config.data);
      const created = { _id: "2", name: body.name, code: body.code, isActive: true };
      locations = [...locations, created];
      return [201, created];
    });

    renderWithClient(<LocationsListPage />);
    await screen.findByText("HQ");

    const user = await openCreateModal();
    await user.type(screen.getByLabelText("Name"), "Branch Office");
    await user.type(screen.getByLabelText("Code"), "BR1");
    await user.click(screen.getByRole("button", { name: "Save" }));

    const row = await screen.findByText("Branch Office");
    const tableRow = row.closest("tr");
    expect(tableRow).not.toBeNull();
    expect(within(tableRow as HTMLElement).getByText("Active")).toBeInTheDocument();
  });

  // UT02: Submit create form with empty code -> inline VALIDATION_ERROR, no new row
  it("UT02: shows an inline validation error and creates no row when code is left empty", async () => {
    const locations = [{ _id: "1", name: "HQ", code: "HQ1", isActive: true }];
    mock.onGet("/locations", { params: {} }).reply(200, locations);
    mock.onPost("/locations").reply(400, {
      error: { code: "VALIDATION_ERROR", message: "Name and code are required." },
    });

    renderWithClient(<LocationsListPage />);
    await screen.findByText("HQ");

    const user = await openCreateModal();
    await user.type(screen.getByLabelText("Name"), "Branch Office");
    await user.click(screen.getByRole("button", { name: "Save" }));

    expect(await screen.findByText("Code is required.")).toBeInTheDocument();
    // No new row was created — only the original location row exists.
    expect(screen.queryByText("Branch Office")).not.toBeInTheDocument();
    expect(screen.getAllByRole("row")).toHaveLength(2); // header row + 1 data row
  });

  // UT03: Submit create form with duplicate code -> inline DUPLICATE_CODE
  it("UT03: shows an inline duplicate-code error when the code is already in use", async () => {
    const locations = [{ _id: "1", name: "HQ", code: "HQ1", isActive: true }];
    mock.onGet("/locations", { params: {} }).reply(200, locations);
    mock.onPost("/locations").reply(409, {
      error: { code: "DUPLICATE_CODE", message: "Code already in use." },
    });

    renderWithClient(<LocationsListPage />);
    await screen.findByText("HQ");

    const user = await openCreateModal();
    await user.type(screen.getByLabelText("Name"), "Branch Office");
    await user.type(screen.getByLabelText("Code"), "HQ1");
    await user.click(screen.getByRole("button", { name: "Save" }));

    expect(
      await screen.findByText("This code is already in use."),
    ).toBeInTheDocument();
    expect(screen.queryByText("Branch Office")).not.toBeInTheDocument();
  });

  // UT04: Load list with mixed-status Locations, no filter -> all rows shown
  it("UT04: shows all locations regardless of status when no filter is applied", async () => {
    const locations = [
      { _id: "1", name: "HQ", code: "HQ1", isActive: true },
      { _id: "2", name: "Old Warehouse", code: "WH1", isActive: false },
    ];
    mock.onGet("/locations", { params: {} }).reply(200, locations);

    renderWithClient(<LocationsListPage />);

    await screen.findByText("HQ");
    expect(screen.getByText("Old Warehouse")).toBeInTheDocument();
  });

  // UT05: Toggle "Active only" filter -> only active rows shown
  it("UT05: shows only active locations when the Active only filter is toggled on", async () => {
    const allLocations = [
      { _id: "1", name: "HQ", code: "HQ1", isActive: true },
      { _id: "2", name: "Old Warehouse", code: "WH1", isActive: false },
    ];
    mock.onGet("/locations", { params: {} }).reply(200, allLocations);
    mock
      .onGet("/locations", { params: { isActive: true } })
      .reply(200, allLocations.filter((location) => location.isActive));

    renderWithClient(<LocationsListPage />);
    await screen.findByText("HQ");
    expect(screen.getByText("Old Warehouse")).toBeInTheDocument();

    const user = userEvent.setup();
    await user.click(screen.getByLabelText("Active only"));

    await waitFor(() => {
      expect(screen.queryByText("Old Warehouse")).not.toBeInTheDocument();
    });
    expect(screen.getByText("HQ")).toBeInTheDocument();
  });
});
