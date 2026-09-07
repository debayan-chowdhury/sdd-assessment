import { afterEach, describe, expect, it, vi } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import MockAdapter from "axios-mock-adapter";
import { api } from "@/lib/axios";
import { renderWithClient } from "@/test/render";
import { EmployeeFormModal } from "./EmployeeFormModal";

// employee-crud-mapping.spec.md — Unit Test Cases UT04, UT05, UT06, UT07, UT09.
const mock = new MockAdapter(api);

afterEach(() => {
  mock.reset();
});

const locations = [{ _id: "loc1", name: "HQ", code: "HQ1", isActive: true }];
const departments = [{ _id: "dept1", name: "Engineering", code: "ENG", isActive: true }];
const roles = [
  { _id: "role-null", name: "Employee Role", code: "EMP", isActive: true, category: null },
  { _id: "role-mgr", name: "Manager Role", code: "MGR", isActive: true, category: "Manager" },
];
const scopedEmployees = [
  {
    _id: "emp-mgr-1",
    name: "Mona Manager",
    email: "mona@example.com",
    isActive: true,
    locationId: "loc1",
    departmentId: "dept1",
    roleId: "role-mgr",
    managerId: null,
    hrId: null,
  },
  {
    _id: "emp-hr-1",
    name: "Harry HR",
    email: "harry@example.com",
    isActive: true,
    locationId: "loc1",
    departmentId: "dept1",
    roleId: "role-hr",
    managerId: null,
    hrId: null,
  },
];

function mockLookups() {
  mock.onGet("/locations", { params: { isActive: true } }).reply(200, locations);
  mock.onGet("/departments", { params: { isActive: true } }).reply(200, departments);
  mock.onGet("/roles", { params: { isActive: true } }).reply(200, [
    ...roles,
    { _id: "role-hr", name: "HR Role", code: "HRR", isActive: true, category: "HR" },
  ]);
  mock
    .onGet("/employees", {
      params: { locationId: "loc1", departmentId: "dept1", isActive: true },
    })
    .reply(200, scopedEmployees);
}

async function fillLocationDepartmentRole(roleName: string) {
  const user = userEvent.setup();
  await screen.findByRole("option", { name: "HQ (HQ1)" });
  await user.selectOptions(screen.getByLabelText("Location"), "HQ (HQ1)");
  await screen.findByRole("option", { name: "Engineering (ENG)" });
  await user.selectOptions(screen.getByLabelText("Department"), "Engineering (ENG)");
  await screen.findByRole("option", { name: roleName });
  await user.selectOptions(screen.getByLabelText("Role"), roleName);
}

describe("EmployeeFormModal (create)", () => {
  // UT04: Submit regular Employee with valid Manager + HR in scope -> row created (201), mappings sent
  it("UT04: submits a regular employee with a valid Manager + HR mapping and closes on success", async () => {
    mockLookups();
    const onClose = vi.fn();
    const user = userEvent.setup();

    renderWithClient(<EmployeeFormModal isOpen onClose={onClose} mode="create" />);

    await fillLocationDepartmentRole("Employee Role (EMP)");

    await user.selectOptions(
      await screen.findByLabelText("Manager"),
      "Mona Manager (mona@example.com)",
    );
    await user.selectOptions(
      await screen.findByLabelText("HR"),
      "Harry HR (harry@example.com)",
    );

    await user.type(screen.getByLabelText("Name"), "New Employee");
    await user.type(screen.getByLabelText("Email"), "new.employee@example.com");
    await user.type(screen.getByLabelText("Password"), "s3cret-pass");

    mock.onPost("/employees").reply(201, {
      _id: "emp-new",
      name: "New Employee",
      email: "new.employee@example.com",
      isActive: true,
      locationId: "loc1",
      departmentId: "dept1",
      roleId: "role-null",
      managerId: "emp-mgr-1",
      hrId: "emp-hr-1",
    });

    await user.click(screen.getByRole("button", { name: "Save" }));

    await waitFor(() => expect(onClose).toHaveBeenCalled());

    const postBody = JSON.parse(mock.history.post[0].data as string);
    expect(postBody).toMatchObject({
      name: "New Employee",
      email: "new.employee@example.com",
      password: "s3cret-pass",
      locationId: "loc1",
      departmentId: "dept1",
      roleId: "role-null",
      managerId: "emp-mgr-1",
      hrId: "emp-hr-1",
    });
  });

  // UT05: Submit regular Employee with Manager field empty -> inline MANAGER_REQUIRED, no row created
  it("UT05: shows inline MANAGER_REQUIRED and does not close when Manager is left empty", async () => {
    mockLookups();
    const onClose = vi.fn();
    const user = userEvent.setup();

    renderWithClient(<EmployeeFormModal isOpen onClose={onClose} mode="create" />);

    await fillLocationDepartmentRole("Employee Role (EMP)");
    // Leave Manager empty; fill everything else that's needed to submit.
    await user.type(screen.getByLabelText("Name"), "New Employee");
    await user.type(screen.getByLabelText("Email"), "new.employee@example.com");
    await user.type(screen.getByLabelText("Password"), "s3cret-pass");

    mock.onPost("/employees").reply(400, {
      error: { code: "MANAGER_REQUIRED", message: "Manager is required for this role." },
    });

    await user.click(screen.getByRole("button", { name: "Save" }));

    expect(await screen.findByText("Manager is required.")).toBeInTheDocument();
    expect(onClose).not.toHaveBeenCalled();
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  // UT06: Submit Manager-category Employee with HR field empty -> inline HR_REQUIRED, no row created
  it("UT06: shows inline HR_REQUIRED and does not close when HR is left empty for a Manager-category role", async () => {
    mockLookups();
    const onClose = vi.fn();
    const user = userEvent.setup();

    renderWithClient(<EmployeeFormModal isOpen onClose={onClose} mode="create" />);

    await fillLocationDepartmentRole("Manager Role (MGR)");

    // Manager-category role: no Manager field should be shown at all.
    expect(screen.queryByLabelText("Manager")).not.toBeInTheDocument();
    // Leave HR empty.
    await user.type(screen.getByLabelText("Name"), "New Manager");
    await user.type(screen.getByLabelText("Email"), "new.manager@example.com");
    await user.type(screen.getByLabelText("Password"), "s3cret-pass");

    mock.onPost("/employees").reply(400, {
      error: { code: "HR_REQUIRED", message: "HR is required for this role." },
    });

    await user.click(screen.getByRole("button", { name: "Save" }));

    expect(await screen.findByText("HR is required.")).toBeInTheDocument();
    expect(onClose).not.toHaveBeenCalled();
  });

  // UT07: Submit create form with email or password empty -> inline VALIDATION_ERROR, no row created
  it("UT07: shows inline VALIDATION_ERROR on Email when email is left empty", async () => {
    mockLookups();
    const onClose = vi.fn();
    const user = userEvent.setup();

    renderWithClient(<EmployeeFormModal isOpen onClose={onClose} mode="create" />);

    await fillLocationDepartmentRole("Employee Role (EMP)");
    await user.selectOptions(
      await screen.findByLabelText("Manager"),
      "Mona Manager (mona@example.com)",
    );
    await user.selectOptions(
      await screen.findByLabelText("HR"),
      "Harry HR (harry@example.com)",
    );
    await user.type(screen.getByLabelText("Name"), "New Employee");
    await user.type(screen.getByLabelText("Password"), "s3cret-pass");
    // Email intentionally left empty.

    mock.onPost("/employees").reply(400, {
      error: { code: "VALIDATION_ERROR", message: "Required fields are missing." },
    });

    await user.click(screen.getByRole("button", { name: "Save" }));

    expect(await screen.findByText("Email is required.")).toBeInTheDocument();
    expect(onClose).not.toHaveBeenCalled();
  });

  it("UT07: shows inline VALIDATION_ERROR on Password when password is left empty", async () => {
    mockLookups();
    const onClose = vi.fn();
    const user = userEvent.setup();

    renderWithClient(<EmployeeFormModal isOpen onClose={onClose} mode="create" />);

    await fillLocationDepartmentRole("Employee Role (EMP)");
    await user.selectOptions(
      await screen.findByLabelText("Manager"),
      "Mona Manager (mona@example.com)",
    );
    await user.selectOptions(
      await screen.findByLabelText("HR"),
      "Harry HR (harry@example.com)",
    );
    await user.type(screen.getByLabelText("Name"), "New Employee");
    await user.type(screen.getByLabelText("Email"), "new.employee@example.com");
    // Password intentionally left empty.

    mock.onPost("/employees").reply(400, {
      error: { code: "VALIDATION_ERROR", message: "Required fields are missing." },
    });

    await user.click(screen.getByRole("button", { name: "Save" }));

    expect(await screen.findByText("Password is required.")).toBeInTheDocument();
    expect(onClose).not.toHaveBeenCalled();
  });

  // UT09: Submit with duplicate email -> inline DUPLICATE_EMAIL
  it("UT09: shows inline DUPLICATE_EMAIL on the Email field", async () => {
    mockLookups();
    const onClose = vi.fn();
    const user = userEvent.setup();

    renderWithClient(<EmployeeFormModal isOpen onClose={onClose} mode="create" />);

    await fillLocationDepartmentRole("Employee Role (EMP)");
    await user.selectOptions(
      await screen.findByLabelText("Manager"),
      "Mona Manager (mona@example.com)",
    );
    await user.selectOptions(
      await screen.findByLabelText("HR"),
      "Harry HR (harry@example.com)",
    );
    await user.type(screen.getByLabelText("Name"), "New Employee");
    await user.type(screen.getByLabelText("Email"), "duplicate@example.com");
    await user.type(screen.getByLabelText("Password"), "s3cret-pass");

    mock.onPost("/employees").reply(409, {
      error: { code: "DUPLICATE_EMAIL", message: "Email already in use." },
    });

    await user.click(screen.getByRole("button", { name: "Save" }));

    expect(await screen.findByText("This email is already in use.")).toBeInTheDocument();
    expect(onClose).not.toHaveBeenCalled();
  });
});
