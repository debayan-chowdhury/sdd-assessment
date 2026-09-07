import { useState } from "react";
import { afterEach, describe, expect, it } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import MockAdapter from "axios-mock-adapter";
import { api } from "@/lib/axios";
import { renderWithClient } from "@/test/render";
import { EmployeeMappingFields } from "./EmployeeMappingFields";

// employee-crud-mapping.spec.md — Unit Test Cases UT01, UT02, UT03.
const mock = new MockAdapter(api);

afterEach(() => {
  mock.reset();
});

const roles = [
  { _id: "role-null", name: "Employee Role", code: "EMP", isActive: true, category: null },
  { _id: "role-mgr", name: "Manager Role", code: "MGR", isActive: true, category: "Manager" },
  { _id: "role-hr", name: "HR Role", code: "HRR", isActive: true, category: "HR" },
];

function Harness() {
  const [locationId, setLocationId] = useState("");
  const [departmentId, setDepartmentId] = useState("");
  const [roleId, setRoleId] = useState("");
  const [managerId, setManagerId] = useState<string | null>(null);
  const [hrId, setHrId] = useState<string | null>(null);

  return (
    <EmployeeMappingFields
      locationId={locationId}
      departmentId={departmentId}
      roleId={roleId}
      managerId={managerId}
      hrId={hrId}
      onLocationChange={setLocationId}
      onDepartmentChange={setDepartmentId}
      onRoleChange={setRoleId}
      onManagerChange={setManagerId}
      onHrChange={setHrId}
    />
  );
}

function mockLookups() {
  mock.onGet("/locations", { params: { isActive: true } }).reply(200, []);
  mock.onGet("/departments", { params: { isActive: true } }).reply(200, []);
  mock.onGet("/roles", { params: { isActive: true } }).reply(200, roles);
}

async function selectRole(name: string) {
  const user = userEvent.setup();
  const roleSelect = await screen.findByLabelText("Role");
  await waitFor(() =>
    expect(screen.getByRole("option", { name: new RegExp(name) })).toBeInTheDocument(),
  );
  await user.selectOptions(roleSelect, screen.getByRole("option", { name: new RegExp(name) }));
}

describe("EmployeeMappingFields", () => {
  // UT01: Select a category: null Role -> Manager + HR fields shown
  it("UT01: shows Manager and HR fields for a category:null role", async () => {
    mockLookups();
    renderWithClient(<Harness />);

    await selectRole("Employee Role");

    expect(await screen.findByLabelText("Manager")).toBeInTheDocument();
    expect(screen.getByLabelText("HR")).toBeInTheDocument();
  });

  // UT02: Select a category: "Manager" Role -> only HR field shown
  it('UT02: shows only the HR field for a category:"Manager" role', async () => {
    mockLookups();
    renderWithClient(<Harness />);

    await selectRole("Manager Role");

    expect(await screen.findByLabelText("HR")).toBeInTheDocument();
    expect(screen.queryByLabelText("Manager")).not.toBeInTheDocument();
  });

  // UT03: Select a category: "HR" Role -> neither Manager nor HR field shown
  it('UT03: shows neither Manager nor HR field for a category:"HR" role', async () => {
    mockLookups();
    renderWithClient(<Harness />);

    await selectRole("HR Role");

    // Wait for the role select's value to actually reflect the selection
    // before asserting a negative (absence) so we're not just observing
    // the pre-selection state.
    await waitFor(() =>
      expect(screen.getByLabelText("Role")).toHaveValue("role-hr"),
    );
    expect(screen.queryByLabelText("Manager")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("HR")).not.toBeInTheDocument();
  });
});
