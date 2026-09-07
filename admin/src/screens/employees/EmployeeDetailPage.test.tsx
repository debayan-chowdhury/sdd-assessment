import { afterEach, describe, expect, it, vi } from "vitest";
import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import MockAdapter from "axios-mock-adapter";
import { api } from "@/lib/axios";
import { renderWithClient } from "@/test/render";
import { EmployeeDetailPage } from "./EmployeeDetailPage";

// employee-crud-mapping.spec.md — Unit Test Cases UT11, UT12, UT13, UT14, UT15, UT16.
const push = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push, replace: vi.fn() }),
  usePathname: () => "/employees/emp1",
}));

const mock = new MockAdapter(api);

afterEach(() => {
  mock.reset();
  push.mockClear();
});

const location = { _id: "loc1", name: "HQ", code: "HQ1", isActive: true };
const department = { _id: "dept1", name: "Engineering", code: "ENG", isActive: true };
const roleNull = { _id: "role-null", name: "Employee Role", code: "EMP", isActive: true, category: null };
const roleMgr = { _id: "role-mgr", name: "Manager Role", code: "MGR", isActive: true, category: "Manager" };
const roleHr = { _id: "role-hr", name: "HR Role", code: "HRR", isActive: true, category: "HR" };

const mona = {
  _id: "emp-mgr-1",
  name: "Mona Manager",
  email: "mona@example.com",
  isActive: true,
  locationId: "loc1",
  departmentId: "dept1",
  roleId: "role-mgr",
  managerId: null,
  hrId: null,
};
const nina = {
  _id: "emp-mgr-2",
  name: "Nina Manager",
  email: "nina@example.com",
  isActive: true,
  locationId: "loc1",
  departmentId: "dept1",
  roleId: "role-mgr",
  managerId: null,
  hrId: null,
};
const harry = {
  _id: "emp-hr-1",
  name: "Harry HR",
  email: "harry@example.com",
  isActive: true,
  locationId: "loc1",
  departmentId: "dept1",
  roleId: "role-hr",
  managerId: null,
  hrId: null,
};

function mockCommonLookups() {
  mock.onGet("/locations/loc1").reply(200, location);
  mock.onGet("/departments/dept1").reply(200, department);
  mock.onGet("/roles/role-null").reply(200, roleNull);
  mock.onGet("/roles/role-mgr").reply(200, roleMgr);
  mock.onGet("/roles/role-hr").reply(200, roleHr);
  mock.onGet("/employees/emp-mgr-1").reply(200, mona);
  mock.onGet("/employees/emp-mgr-2").reply(200, nina);
  mock.onGet("/employees/emp-hr-1").reply(200, harry);
}

describe("EmployeeDetailPage", () => {
  // UT11: Open detail screen for existing Employee -> fields + mapping populated
  it("UT11: shows name, email, status, location/department/role, and manager/HR mapping", async () => {
    mockCommonLookups();
    mock.onGet("/employees/emp1").reply(200, {
      _id: "emp1",
      name: "Alice",
      email: "alice@example.com",
      isActive: true,
      locationId: "loc1",
      departmentId: "dept1",
      roleId: "role-null",
      managerId: "emp-mgr-1",
      hrId: "emp-hr-1",
    });

    renderWithClient(<EmployeeDetailPage employeeId="emp1" />);

    expect(await screen.findByRole("heading", { name: "Alice" })).toBeInTheDocument();
    expect(screen.getByText("alice@example.com")).toBeInTheDocument();
    expect(screen.getByText("Active")).toBeInTheDocument();
    expect(await screen.findByText("HQ")).toBeInTheDocument();
    expect(await screen.findByText("Engineering")).toBeInTheDocument();
    expect(await screen.findByText("Employee Role")).toBeInTheDocument();
    expect(await screen.findByText("Mona Manager (mona@example.com)")).toBeInTheDocument();
    expect(await screen.findByText("Harry HR (harry@example.com)")).toBeInTheDocument();
  });

  // UT12: Submit edit form changing Manager mapping -> row/detail reflects update
  it("UT12: reflects a changed Manager mapping after editing", async () => {
    mockCommonLookups();

    const employeeState = {
      _id: "emp1",
      name: "Alice",
      email: "alice@example.com",
      isActive: true,
      locationId: "loc1",
      departmentId: "dept1",
      roleId: "role-null",
      managerId: "emp-mgr-1",
      hrId: "emp-hr-1",
    };
    mock.onGet("/employees/emp1").reply(() => [200, { ...employeeState }]);
    mock.onGet("/locations", { params: { isActive: true } }).reply(200, [location]);
    mock.onGet("/departments", { params: { isActive: true } }).reply(200, [department]);
    mock
      .onGet("/roles", { params: { isActive: true } })
      .reply(200, [roleNull, roleMgr, roleHr]);
    mock
      .onGet("/employees", {
        params: { locationId: "loc1", departmentId: "dept1", isActive: true },
      })
      .reply(200, [mona, nina, harry]);
    mock.onPut("/employees/emp1").reply((config) => {
      const body = JSON.parse(config.data as string);
      Object.assign(employeeState, body);
      return [200, { ...employeeState }];
    });

    const user = userEvent.setup();
    renderWithClient(<EmployeeDetailPage employeeId="emp1" />);

    expect(await screen.findByText("Mona Manager (mona@example.com)")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Edit" }));
    const dialog = await screen.findByRole("dialog");

    await waitFor(() =>
      expect(
        within(dialog).getByRole("option", { name: "Nina Manager (nina@example.com)" }),
      ).toBeInTheDocument(),
    );
    await user.selectOptions(
      within(dialog).getByLabelText("Manager"),
      "Nina Manager (nina@example.com)",
    );
    await user.click(within(dialog).getByRole("button", { name: "Save" }));

    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());

    expect(await screen.findByText("Nina Manager (nina@example.com)")).toBeInTheDocument();
    expect(screen.queryByText("Mona Manager (mona@example.com)")).not.toBeInTheDocument();
  });

  // UT13: Deactivate an Employee -> status becomes inactive
  it("UT13: deactivates an active employee", async () => {
    mockCommonLookups();
    const employeeState = {
      _id: "emp1",
      name: "Alice",
      email: "alice@example.com",
      isActive: true,
      locationId: "loc1",
      departmentId: "dept1",
      roleId: "role-null",
      managerId: null,
      hrId: null,
    };
    mock.onGet("/employees/emp1").reply(() => [200, { ...employeeState }]);
    mock.onPatch("/employees/emp1/status").reply((config) => {
      const body = JSON.parse(config.data as string);
      employeeState.isActive = body.isActive;
      return [200, { ...employeeState }];
    });

    const user = userEvent.setup();
    renderWithClient(<EmployeeDetailPage employeeId="emp1" />);

    expect(await screen.findByText("Active")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Deactivate" }));
    const dialog = await screen.findByRole("dialog");
    await user.click(within(dialog).getByRole("button", { name: "Deactivate" }));

    await waitFor(() => expect(screen.getByText("Inactive")).toBeInTheDocument());
  });

  // UT14: Reactivate an inactive Employee -> status becomes active
  it("UT14: reactivates an inactive employee", async () => {
    mockCommonLookups();
    const employeeState = {
      _id: "emp1",
      name: "Alice",
      email: "alice@example.com",
      isActive: false,
      locationId: "loc1",
      departmentId: "dept1",
      roleId: "role-null",
      managerId: null,
      hrId: null,
    };
    mock.onGet("/employees/emp1").reply(() => [200, { ...employeeState }]);
    mock.onPatch("/employees/emp1/status").reply((config) => {
      const body = JSON.parse(config.data as string);
      employeeState.isActive = body.isActive;
      return [200, { ...employeeState }];
    });

    const user = userEvent.setup();
    renderWithClient(<EmployeeDetailPage employeeId="emp1" />);

    expect(await screen.findByText("Inactive")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Reactivate" }));

    await waitFor(() => expect(screen.getByText("Active")).toBeInTheDocument());
  });

  // UT15: Delete an Employee referenced by no one, confirm dialog -> Employee gone, redirected to list
  it("UT15: deletes an employee with no dependents and redirects to the list", async () => {
    mockCommonLookups();
    mock.onGet("/employees/emp1").reply(200, {
      _id: "emp1",
      name: "Alice",
      email: "alice@example.com",
      isActive: true,
      locationId: "loc1",
      departmentId: "dept1",
      roleId: "role-null",
      managerId: null,
      hrId: null,
    });
    mock.onDelete("/employees/emp1").reply(200);

    const user = userEvent.setup();
    renderWithClient(<EmployeeDetailPage employeeId="emp1" />);

    await screen.findByRole("heading", { name: "Alice" });
    await user.click(screen.getByRole("button", { name: "Delete" }));
    const dialog = await screen.findByRole("dialog");
    await user.click(within(dialog).getByRole("button", { name: "Delete" }));

    await waitFor(() => expect(push).toHaveBeenCalledWith("/employees"));
  });

  // UT16: Delete an Employee who is another's Manager or HR -> EMPLOYEE_HAS_DEPENDENTS shown
  it("UT16: shows EMPLOYEE_HAS_DEPENDENTS and does not redirect when the employee has dependents", async () => {
    mockCommonLookups();
    mock.onGet("/employees/emp1").reply(200, {
      _id: "emp1",
      name: "Alice",
      email: "alice@example.com",
      isActive: true,
      locationId: "loc1",
      departmentId: "dept1",
      roleId: "role-mgr",
      managerId: null,
      hrId: null,
    });
    mock.onDelete("/employees/emp1").reply(409, {
      error: {
        code: "EMPLOYEE_HAS_DEPENDENTS",
        message: "This employee cannot be deleted.",
      },
    });

    const user = userEvent.setup();
    renderWithClient(<EmployeeDetailPage employeeId="emp1" />);

    await screen.findByRole("heading", { name: "Alice" });
    await user.click(screen.getByRole("button", { name: "Delete" }));
    const dialog = await screen.findByRole("dialog");
    await user.click(within(dialog).getByRole("button", { name: "Delete" }));

    expect(
      await screen.findByText(
        "This employee is another employee's manager or HR contact and cannot be deleted.",
      ),
    ).toBeInTheDocument();
    expect(push).not.toHaveBeenCalled();
  });
});
