import { afterEach, describe, expect, it, vi } from "vitest";
import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import MockAdapter from "axios-mock-adapter";
import { api } from "@/lib/axios";
import { renderWithClient } from "@/test/render";
import { EmployeesListPage } from "./EmployeesListPage";

// employee-crud-mapping.spec.md — Unit Test Case UT10.
const push = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push, replace: vi.fn() }),
  usePathname: () => "/employees",
}));

const mock = new MockAdapter(api);

afterEach(() => {
  mock.reset();
  push.mockClear();
});

const departments = [
  { _id: "dept1", name: "Engineering", code: "ENG", isActive: true },
  { _id: "dept2", name: "Sales", code: "SAL", isActive: true },
];
const locations = [{ _id: "loc1", name: "HQ", code: "HQ1", isActive: true }];
const roles = [{ _id: "role-null", name: "Employee Role", code: "EMP", isActive: true, category: null }];

const alice = {
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
const bob = {
  _id: "emp2",
  name: "Bob",
  email: "bob@example.com",
  isActive: false,
  locationId: "loc1",
  departmentId: "dept1",
  roleId: "role-null",
  managerId: null,
  hrId: null,
};
const carol = {
  _id: "emp3",
  name: "Carol",
  email: "carol@example.com",
  isActive: true,
  locationId: "loc1",
  departmentId: "dept2",
  roleId: "role-null",
  managerId: null,
  hrId: null,
};

describe("EmployeesListPage", () => {
  // UT10: Apply departmentId + isActive=true filters -> only matching Employees listed
  it("UT10: filters the employee list by department and active-only", async () => {
    mock.onGet("/locations").reply(200, locations);
    mock.onGet("/departments").reply(200, departments);
    mock.onGet("/roles").reply(200, roles);
    mock.onGet("/employees", { params: {} }).reply(200, [alice, bob, carol]);
    mock
      .onGet("/employees", { params: { isActive: true, departmentId: "dept1" } })
      .reply(200, [alice]);

    const user = userEvent.setup();
    renderWithClient(<EmployeesListPage />);

    // Initial, unfiltered list shows all three employees.
    expect(await screen.findByText("Alice")).toBeInTheDocument();
    expect(screen.getByText("Bob")).toBeInTheDocument();
    expect(screen.getByText("Carol")).toBeInTheDocument();

    await user.click(screen.getByLabelText("Active only"));
    await waitFor(() =>
      expect(screen.getByRole("option", { name: "Engineering" })).toBeInTheDocument(),
    );
    await user.selectOptions(screen.getByLabelText("Department"), "Engineering");

    await waitFor(() => {
      expect(screen.getByText("Alice")).toBeInTheDocument();
      expect(screen.queryByText("Bob")).not.toBeInTheDocument();
      expect(screen.queryByText("Carol")).not.toBeInTheDocument();
    });

    const table = screen.getByRole("table");
    const rows = within(table).getAllByRole("row");
    // Header row + exactly one matching data row.
    expect(rows).toHaveLength(2);
  });
});
