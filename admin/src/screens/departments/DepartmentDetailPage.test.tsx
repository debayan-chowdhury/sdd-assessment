import { afterEach, describe, expect, it, vi } from "vitest";
import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import MockAdapter from "axios-mock-adapter";
import { DepartmentDetailPage } from "./DepartmentDetailPage";
import { renderWithClient } from "@/test/render";
import { api } from "@/lib/axios";

// department-crud.spec.md — Unit Test Cases UT06, UT07, UT09, UT10, UT11, UT15, UT16.
const push = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push, replace: vi.fn() }),
  usePathname: () => "/departments/d1",
}));

const mock = new MockAdapter(api);

afterEach(() => {
  mock.reset();
  push.mockClear();
});

describe("DepartmentDetailPage", () => {
  // UT06: Open detail screen for existing Department -> Fields + enabled Roles (with category) populated
  it("UT06: shows department fields and enabled roles with category on load", async () => {
    mock.onGet("/departments/d1").reply(200, {
      _id: "d1",
      name: "Engineering",
      code: "ENG",
      isActive: true,
    });
    mock.onGet("/departments/d1/roles").reply(200, [
      { _id: "r1", name: "Team Lead", code: "TL", isActive: true, category: "Manager" },
    ]);
    mock.onGet("/roles").reply(200, []);

    renderWithClient(<DepartmentDetailPage departmentId="d1" />);

    expect(await screen.findByRole("heading", { name: "Engineering" })).toBeInTheDocument();
    expect(screen.getByText("ENG")).toBeInTheDocument();
    expect(screen.getByText("Active")).toBeInTheDocument();
    expect(await screen.findByText(/Team Lead/)).toBeInTheDocument();
    expect(screen.getByText("Manager")).toBeInTheDocument();
  });

  // UT07: Submit edit form with new name/code -> Row/detail reflects update
  it("UT07: reflects updated name/code after a successful edit", async () => {
    let department = { _id: "d1", name: "Engineering", code: "ENG", isActive: true };
    mock.onGet("/departments/d1").reply(() => [200, department]);
    mock.onGet("/departments/d1/roles").reply(200, []);
    mock.onGet("/roles").reply(200, []);
    mock.onPut("/departments/d1").reply((config) => {
      const body = JSON.parse(config.data as string);
      department = { ...department, ...body };
      return [200, department];
    });

    renderWithClient(<DepartmentDetailPage departmentId="d1" />);
    expect(await screen.findByRole("heading", { name: "Engineering" })).toBeInTheDocument();

    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: "Edit" }));

    const nameInput = screen.getByLabelText("Name");
    await user.clear(nameInput);
    await user.type(nameInput, "Engineering Team");
    const codeInput = screen.getByLabelText("Code");
    await user.clear(codeInput);
    await user.type(codeInput, "ENG2");
    await user.click(screen.getByRole("button", { name: "Save" }));

    expect(await screen.findByRole("heading", { name: "Engineering Team" })).toBeInTheDocument();
    expect(screen.getByText("ENG2")).toBeInTheDocument();
  });

  // UT09: Deactivate Department with no mapped Employees -> Status becomes inactive
  it("UT09: deactivates a department with no mapped employees", async () => {
    let isActive = true;
    mock.onGet("/departments/d1").reply(() => [
      200,
      { _id: "d1", name: "Engineering", code: "ENG", isActive },
    ]);
    mock.onGet("/departments/d1/roles").reply(200, []);
    mock.onGet("/roles").reply(200, []);
    mock.onPatch("/departments/d1/status").reply((config) => {
      isActive = JSON.parse(config.data as string).isActive;
      return [200, { _id: "d1", name: "Engineering", code: "ENG", isActive }];
    });

    renderWithClient(<DepartmentDetailPage departmentId="d1" />);
    expect(await screen.findByText("Active")).toBeInTheDocument();

    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: "Deactivate" }));
    const dialog = await screen.findByRole("dialog");
    await user.click(within(dialog).getByRole("button", { name: "Deactivate" }));

    await waitFor(() => expect(screen.getByText("Inactive")).toBeInTheDocument());
  });

  // UT10: Deactivate Department with a mapped active Employee -> DEPARTMENT_HAS_ACTIVE_EMPLOYEES shown, status unchanged
  it("UT10: shows DEPARTMENT_HAS_ACTIVE_EMPLOYEES and leaves status unchanged", async () => {
    mock.onGet("/departments/d1").reply(200, {
      _id: "d1",
      name: "Engineering",
      code: "ENG",
      isActive: true,
    });
    mock.onGet("/departments/d1/roles").reply(200, []);
    mock.onGet("/roles").reply(200, []);
    mock.onPatch("/departments/d1/status").reply(409, {
      error: {
        code: "DEPARTMENT_HAS_ACTIVE_EMPLOYEES",
        message: "This department has active employees.",
      },
    });

    renderWithClient(<DepartmentDetailPage departmentId="d1" />);
    expect(await screen.findByText("Active")).toBeInTheDocument();

    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: "Deactivate" }));
    const dialog = await screen.findByRole("dialog");
    await user.click(within(dialog).getByRole("button", { name: "Deactivate" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "This department has active employees mapped to it and cannot be deactivated.",
    );
    expect(screen.getByText("Active")).toBeInTheDocument();
  });

  // UT11: Reactivate an inactive Department -> Status becomes active
  it("UT11: reactivates an inactive department", async () => {
    let isActive = false;
    mock.onGet("/departments/d1").reply(() => [
      200,
      { _id: "d1", name: "Engineering", code: "ENG", isActive },
    ]);
    mock.onGet("/departments/d1/roles").reply(200, []);
    mock.onGet("/roles").reply(200, []);
    mock.onPatch("/departments/d1/status").reply((config) => {
      isActive = JSON.parse(config.data as string).isActive;
      return [200, { _id: "d1", name: "Engineering", code: "ENG", isActive }];
    });

    renderWithClient(<DepartmentDetailPage departmentId="d1" />);
    expect(await screen.findByText("Inactive")).toBeInTheDocument();

    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: "Reactivate" }));

    await waitFor(() => expect(screen.getByText("Active")).toBeInTheDocument());
  });

  // UT15: Delete a Department with no mapped Employees, confirm dialog -> Department gone, redirected to list
  it("UT15: deletes a department with no mapped employees and redirects to the list", async () => {
    mock.onGet("/departments/d1").reply(200, {
      _id: "d1",
      name: "Engineering",
      code: "ENG",
      isActive: true,
    });
    mock.onGet("/departments/d1/roles").reply(200, []);
    mock.onGet("/roles").reply(200, []);
    mock.onDelete("/departments/d1").reply(204);

    renderWithClient(<DepartmentDetailPage departmentId="d1" />);
    expect(await screen.findByRole("heading", { name: "Engineering" })).toBeInTheDocument();

    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: "Delete" }));
    const dialog = await screen.findByRole("dialog");
    await user.click(within(dialog).getByRole("button", { name: "Delete" }));

    await waitFor(() => expect(push).toHaveBeenCalledWith("/departments"));
  });

  // UT16: Delete a Department with a mapped Employee -> DEPARTMENT_HAS_EMPLOYEES shown
  it("UT16: shows DEPARTMENT_HAS_EMPLOYEES and does not delete or redirect", async () => {
    mock.onGet("/departments/d1").reply(200, {
      _id: "d1",
      name: "Engineering",
      code: "ENG",
      isActive: true,
    });
    mock.onGet("/departments/d1/roles").reply(200, []);
    mock.onGet("/roles").reply(200, []);
    mock.onDelete("/departments/d1").reply(409, {
      error: {
        code: "DEPARTMENT_HAS_EMPLOYEES",
        message: "This department has employees.",
      },
    });

    renderWithClient(<DepartmentDetailPage departmentId="d1" />);
    expect(await screen.findByRole("heading", { name: "Engineering" })).toBeInTheDocument();

    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: "Delete" }));
    const dialog = await screen.findByRole("dialog");
    await user.click(within(dialog).getByRole("button", { name: "Delete" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "This department has employees mapped to it and cannot be deleted.",
    );
    expect(push).not.toHaveBeenCalled();
  });
});
