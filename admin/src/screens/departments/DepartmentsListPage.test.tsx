import { afterEach, describe, expect, it, vi } from "vitest";
import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import MockAdapter from "axios-mock-adapter";
import { DepartmentsListPage } from "./DepartmentsListPage";
import { renderWithClient } from "@/test/render";
import { api } from "@/lib/axios";

// department-crud.spec.md — Unit Test Cases UT01, UT02, UT04, UT05.
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
  usePathname: () => "/departments",
}));

const mock = new MockAdapter(api);

afterEach(() => {
  mock.reset();
});

describe("DepartmentsListPage", () => {
  // UT01: Submit create form with valid name/code -> New row rendered, Active badge
  it("UT01: creates a department with valid name/code and shows the new row with an Active badge", async () => {
    let departments: Array<{ _id: string; name: string; code: string; isActive: boolean }> = [];
    mock.onGet("/departments").reply(() => [200, departments]);
    mock.onPost("/departments", { name: "Engineering", code: "ENG" }).reply(() => {
      const created = { _id: "d1", name: "Engineering", code: "ENG", isActive: true };
      departments = [...departments, created];
      return [201, created];
    });

    renderWithClient(<DepartmentsListPage />);
    await screen.findByText("No departments found.");

    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: "Add Department" }));
    await user.type(screen.getByLabelText("Name"), "Engineering");
    await user.type(screen.getByLabelText("Code"), "ENG");
    await user.click(screen.getByRole("button", { name: "Save" }));

    const row = (await screen.findByText("Engineering")).closest("tr");
    expect(row).not.toBeNull();
    expect(within(row as HTMLElement).getByText("Active")).toBeInTheDocument();
  });

  // UT02: Submit create form with empty `name` -> Inline VALIDATION_ERROR, no new row
  it("UT02: shows an inline VALIDATION_ERROR and creates no row when name is empty", async () => {
    mock.onGet("/departments").reply(200, []);
    mock.onPost("/departments").reply(400, {
      error: { code: "VALIDATION_ERROR", message: "Name and code are required." },
    });

    renderWithClient(<DepartmentsListPage />);
    await screen.findByText("No departments found.");

    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: "Add Department" }));
    await user.type(screen.getByLabelText("Code"), "ENG");
    await user.click(screen.getByRole("button", { name: "Save" }));

    expect(await screen.findByText("Name is required.")).toBeInTheDocument();
    expect(screen.getByText("No departments found.")).toBeInTheDocument();
  });

  // UT04: Load list with mixed-status Departments, no filter -> All rows shown
  it("UT04: shows all departments regardless of status when no filter is applied", async () => {
    mock.onGet("/departments").reply(200, [
      { _id: "d1", name: "Engineering", code: "ENG", isActive: true },
      { _id: "d2", name: "Legacy", code: "LEG", isActive: false },
    ]);

    renderWithClient(<DepartmentsListPage />);

    expect(await screen.findByText("Engineering")).toBeInTheDocument();
    expect(screen.getByText("Legacy")).toBeInTheDocument();
  });

  // UT05: Toggle "Active only" filter -> Only active rows shown
  it("UT05: shows only active departments when the Active only filter is toggled", async () => {
    mock.onGet("/departments").reply((config) => {
      const all = [
        { _id: "d1", name: "Engineering", code: "ENG", isActive: true },
        { _id: "d2", name: "Legacy", code: "LEG", isActive: false },
      ];
      if (config.params?.isActive) {
        return [200, all.filter((department) => department.isActive)];
      }
      return [200, all];
    });

    renderWithClient(<DepartmentsListPage />);
    expect(await screen.findByText("Legacy")).toBeInTheDocument();

    const user = userEvent.setup();
    await user.click(screen.getByLabelText("Active only"));

    await waitFor(() => expect(screen.queryByText("Legacy")).not.toBeInTheDocument());
    expect(screen.getByText("Engineering")).toBeInTheDocument();
  });
});
