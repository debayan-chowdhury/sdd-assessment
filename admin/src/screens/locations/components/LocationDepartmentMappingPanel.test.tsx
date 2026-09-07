import { afterEach, describe, expect, it } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import MockAdapter from "axios-mock-adapter";
import { LocationDepartmentMappingPanel } from "./LocationDepartmentMappingPanel";
import { renderWithClient } from "@/test/render";
import { api } from "@/lib/axios";

// location-crud.spec.md — Unit Test Cases UT12, UT13, UT14.

const mock = new MockAdapter(api);

afterEach(() => {
  mock.reset();
});

describe("LocationDepartmentMappingPanel", () => {
  // UT12: Add an unmapped Department -> appears in mapped list
  it("UT12: adds an unmapped department and shows it in the mapped list", async () => {
    let mapped: Array<{ _id: string; name: string; code: string; isActive: boolean }> = [];
    mock.onGet("/locations/loc1/departments").reply(() => [200, mapped]);
    mock
      .onGet("/departments", { params: {} })
      .reply(200, [{ _id: "d1", name: "Sales", code: "SAL", isActive: true }]);
    mock.onPost("/locations/loc1/departments").reply((config) => {
      const body = JSON.parse(config.data);
      expect(body).toEqual({ departmentId: "d1" });
      mapped = [{ _id: "d1", name: "Sales", code: "SAL", isActive: true }];
      return [201, {}];
    });

    renderWithClient(<LocationDepartmentMappingPanel locationId="loc1" />);
    await screen.findByText("No departments mapped.");

    const user = userEvent.setup();
    await user.selectOptions(screen.getByLabelText("Add Department"), "d1");
    await user.click(screen.getByRole("button", { name: "Add" }));

    expect(await screen.findByText("Sales (SAL)")).toBeInTheDocument();
  });

  // UT13: Add an already-mapped Department -> MAPPING_ALREADY_EXISTS shown
  it("UT13: shows a mapping-already-exists error and adds no duplicate row", async () => {
    // The mapped-departments query has not yet caught up with the server's
    // state (e.g. a race with another session), so the department is still
    // selectable — but the server rejects the add as a duplicate mapping.
    mock.onGet("/locations/loc1/departments").reply(200, []);
    mock
      .onGet("/departments", { params: {} })
      .reply(200, [{ _id: "d1", name: "Sales", code: "SAL", isActive: true }]);
    mock.onPost("/locations/loc1/departments").reply(409, {
      error: { code: "MAPPING_ALREADY_EXISTS", message: "Mapping already exists." },
    });

    renderWithClient(<LocationDepartmentMappingPanel locationId="loc1" />);
    await screen.findByText("No departments mapped.");

    const user = userEvent.setup();
    await user.selectOptions(screen.getByLabelText("Add Department"), "d1");
    await user.click(screen.getByRole("button", { name: "Add" }));

    expect(
      await screen.findByText("This department is already mapped to this location."),
    ).toBeInTheDocument();
    // The component renders either the empty-state message or the mapped
    // list, never both — so this alone confirms no mapping row was added.
    expect(screen.getByText("No departments mapped.")).toBeInTheDocument();
  });

  // UT14: Remove a mapped Department -> removed from mapped list
  it("UT14: removes a mapped department from the mapped list", async () => {
    let mapped = [{ _id: "d1", name: "Sales", code: "SAL", isActive: true }];
    mock.onGet("/locations/loc1/departments").reply(() => [200, mapped]);
    mock.onGet("/departments", { params: {} }).reply(200, []);
    mock.onDelete("/locations/loc1/departments/d1").reply(() => {
      mapped = [];
      return [200, {}];
    });

    renderWithClient(<LocationDepartmentMappingPanel locationId="loc1" />);
    await screen.findByText("Sales (SAL)");

    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: "Remove" }));

    await waitFor(() => {
      expect(screen.getByText("No departments mapped.")).toBeInTheDocument();
    });
    expect(screen.queryByText("Sales (SAL)")).not.toBeInTheDocument();
  });
});
