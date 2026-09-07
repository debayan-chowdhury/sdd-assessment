import { afterEach, describe, expect, it } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import MockAdapter from "axios-mock-adapter";
import { DepartmentRoleMappingPanel } from "./DepartmentRoleMappingPanel";
import { renderWithClient } from "@/test/render";
import { api } from "@/lib/axios";

// department-crud.spec.md — Unit Test Cases UT12, UT13, UT14.
const mock = new MockAdapter(api);

afterEach(() => {
  mock.reset();
});

describe("DepartmentRoleMappingPanel", () => {
  // UT12: Enable a not-yet-enabled Role -> Appears in enabled list with category
  it("UT12: enables a not-yet-enabled role and shows it with its category", async () => {
    let mapped: Array<{ _id: string; name: string; code: string; isActive: boolean; category: string | null }> = [];
    mock.onGet("/departments/d1/roles").reply(() => [200, mapped]);
    mock.onGet("/roles").reply(200, [
      { _id: "r1", name: "Team Lead", code: "TL", isActive: true, category: "Manager" },
    ]);
    mock.onPost("/departments/d1/roles", { roleId: "r1" }).reply(() => {
      mapped = [{ _id: "r1", name: "Team Lead", code: "TL", isActive: true, category: "Manager" }];
      return [201, {}];
    });

    renderWithClient(<DepartmentRoleMappingPanel departmentId="d1" />);
    await screen.findByRole("option", { name: /Team Lead/ });

    const user = userEvent.setup();
    await user.selectOptions(screen.getByLabelText("Enable Role"), "r1");
    await user.click(screen.getByRole("button", { name: "Enable" }));

    expect(await screen.findByText(/Team Lead/)).toBeInTheDocument();
    expect(screen.getByText("Manager")).toBeInTheDocument();
  });

  // UT13: Enable an already-enabled Role -> MAPPING_ALREADY_EXISTS shown
  it("UT13: shows MAPPING_ALREADY_EXISTS and adds no duplicate row when enabling an already-enabled role", async () => {
    mock.onGet("/departments/d1/roles").reply(200, []);
    mock.onGet("/roles").reply(200, [
      { _id: "r1", name: "Team Lead", code: "TL", isActive: true, category: "Manager" },
    ]);
    mock.onPost("/departments/d1/roles", { roleId: "r1" }).reply(409, {
      error: { code: "MAPPING_ALREADY_EXISTS", message: "Already mapped." },
    });

    renderWithClient(<DepartmentRoleMappingPanel departmentId="d1" />);
    await screen.findByRole("option", { name: /Team Lead/ });

    const user = userEvent.setup();
    await user.selectOptions(screen.getByLabelText("Enable Role"), "r1");
    await user.click(screen.getByRole("button", { name: "Enable" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "This role is already enabled for this department.",
    );
    expect(screen.getByText("No roles enabled.")).toBeInTheDocument();
  });

  // UT14: Disable an enabled Role -> Removed from enabled list
  it("UT14: disables an enabled role and removes it from the enabled list", async () => {
    let mapped: Array<{ _id: string; name: string; code: string; isActive: boolean; category: string | null }> = [
      { _id: "r1", name: "Team Lead", code: "TL", isActive: true, category: "Manager" },
    ];
    mock.onGet("/departments/d1/roles").reply(() => [200, mapped]);
    mock.onGet("/roles").reply(200, [
      { _id: "r1", name: "Team Lead", code: "TL", isActive: true, category: "Manager" },
    ]);
    mock.onDelete("/departments/d1/roles/r1").reply(() => {
      mapped = [];
      return [204];
    });

    renderWithClient(<DepartmentRoleMappingPanel departmentId="d1" />);
    expect(await screen.findByText(/Team Lead/)).toBeInTheDocument();

    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: "Disable" }));

    await waitFor(() => expect(screen.getByText("No roles enabled.")).toBeInTheDocument());
  });
});
