import { afterEach, describe, expect, it, vi } from "vitest";
import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import MockAdapter from "axios-mock-adapter";
import { RoleDetailPage } from "./RoleDetailPage";
import { renderWithClient } from "@/test/render";
import { api } from "@/lib/axios";

// role-crud.spec.md — Unit Test Cases UT09-UT16 (detail/edit + status/delete actions).
const push = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push, replace: vi.fn() }),
  usePathname: () => "/roles/r1",
}));

const mock = new MockAdapter(api);

afterEach(() => {
  mock.reset();
  push.mockClear();
});

type RoleDto = {
  _id: string;
  name: string;
  code: string;
  isActive: boolean;
  category: "HR" | "Manager" | null;
};

const hrRole: RoleDto = {
  _id: "r1",
  name: "HR Generalist",
  code: "HRG",
  isActive: true,
  category: "HR",
};

const inactiveRole: RoleDto = {
  _id: "r1",
  name: "HR Generalist",
  code: "HRG",
  isActive: false,
  category: "HR",
};

describe("RoleDetailPage", () => {
  // UT09: Open detail screen for existing Role -> fields populated incl. category
  it("UT09: displays the role's current name, code, status, and category", async () => {
    mock.onGet("/roles/r1").reply(200, hrRole);

    renderWithClient(<RoleDetailPage roleId="r1" />);

    expect(await screen.findByRole("heading", { name: "HR Generalist" })).toBeInTheDocument();
    expect(screen.getByText("Active")).toBeInTheDocument();
    expect(screen.getByText("HRG")).toBeInTheDocument();
    // "HR" appears both as the CategoryBadge and in the definition list.
    expect(screen.getAllByText("HR").length).toBeGreaterThan(0);
  });

  // UT10: Submit edit form with new name/code/category -> Role's row/detail reflects update
  it("UT10: reflects updated name/code/category after a successful edit", async () => {
    mock.onGet("/roles/r1").replyOnce(200, hrRole);
    const updated: RoleDto = {
      _id: "r1",
      name: "People Partner",
      code: "PP",
      isActive: true,
      category: "Manager",
    };
    mock
      .onPut("/roles/r1", { name: "People Partner", code: "PP", category: "Manager" })
      .reply(200, updated);
    mock.onGet("/roles/r1").replyOnce(200, updated);

    renderWithClient(<RoleDetailPage roleId="r1" />);
    await screen.findByRole("heading", { name: "HR Generalist" });

    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: "Edit" }));

    const dialog = screen.getByRole("dialog", { name: "Edit Role" });
    const nameInput = within(dialog).getByLabelText("Name");
    const codeInput = within(dialog).getByLabelText("Code");
    await user.clear(nameInput);
    await user.type(nameInput, "People Partner");
    await user.clear(codeInput);
    await user.type(codeInput, "PP");
    await user.selectOptions(within(dialog).getByLabelText("Category"), "Manager");
    await user.click(within(dialog).getByRole("button", { name: "Save" }));

    expect(
      await screen.findByRole("heading", { name: "People Partner" }),
    ).toBeInTheDocument();
    expect(screen.getByText("PP")).toBeInTheDocument();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  // UT11: Submit edit form with a duplicate code -> Inline DUPLICATE_CODE, no update
  it("UT11: shows an inline DUPLICATE_CODE error and leaves the role unchanged", async () => {
    mock.onGet("/roles/r1").reply(200, hrRole);
    mock
      .onPut("/roles/r1", { name: "HR Generalist", code: "TAKEN", category: "HR" })
      .reply(409, {
        error: { code: "DUPLICATE_CODE", message: "This code is already in use." },
      });

    renderWithClient(<RoleDetailPage roleId="r1" />);
    await screen.findByRole("heading", { name: "HR Generalist" });

    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: "Edit" }));

    const dialog = screen.getByRole("dialog", { name: "Edit Role" });
    const codeInput = within(dialog).getByLabelText("Code");
    await user.clear(codeInput);
    await user.type(codeInput, "TAKEN");
    await user.click(within(dialog).getByRole("button", { name: "Save" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "This code is already in use.",
    );
    expect(screen.getByRole("heading", { name: "HR Generalist" })).toBeInTheDocument();
    expect(screen.getByText("HRG")).toBeInTheDocument();
  });

  // UT12: Deactivate Role with no Employees holding it -> Status becomes inactive
  it("UT12: deactivates a role with no employees holding it", async () => {
    mock.onGet("/roles/r1").replyOnce(200, hrRole);
    mock.onPatch("/roles/r1/status", { isActive: false }).reply(200, inactiveRole);
    mock.onGet("/roles/r1").replyOnce(200, inactiveRole);

    renderWithClient(<RoleDetailPage roleId="r1" />);
    await screen.findByRole("heading", { name: "HR Generalist" });

    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: "Deactivate" }));

    const dialog = screen.getByRole("dialog", { name: "Deactivate Role" });
    await user.click(within(dialog).getByRole("button", { name: "Deactivate" }));

    await waitFor(() => expect(screen.getByText("Inactive")).toBeInTheDocument());
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  // UT13: Deactivate Role with an active Employee holding it -> ROLE_HAS_ACTIVE_EMPLOYEES shown, status unchanged
  it("UT13: shows ROLE_HAS_ACTIVE_EMPLOYEES and leaves status unchanged", async () => {
    mock.onGet("/roles/r1").reply(200, hrRole);
    mock.onPatch("/roles/r1/status", { isActive: false }).reply(409, {
      error: {
        code: "ROLE_HAS_ACTIVE_EMPLOYEES",
        message: "This role has active employees.",
      },
    });

    renderWithClient(<RoleDetailPage roleId="r1" />);
    await screen.findByRole("heading", { name: "HR Generalist" });

    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: "Deactivate" }));
    const dialog = screen.getByRole("dialog", { name: "Deactivate Role" });
    await user.click(within(dialog).getByRole("button", { name: "Deactivate" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "This role has active employees holding it and cannot be deactivated.",
    );
    expect(screen.getByText("Active")).toBeInTheDocument();
  });

  // UT14: Reactivate an inactive Role -> Status becomes active
  it("UT14: reactivates an inactive role", async () => {
    mock.onGet("/roles/r1").replyOnce(200, inactiveRole);
    mock.onPatch("/roles/r1/status", { isActive: true }).reply(200, hrRole);
    mock.onGet("/roles/r1").replyOnce(200, hrRole);

    renderWithClient(<RoleDetailPage roleId="r1" />);
    await screen.findByRole("heading", { name: "HR Generalist" });
    expect(screen.getByText("Inactive")).toBeInTheDocument();

    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: "Reactivate" }));

    await waitFor(() => expect(screen.getByText("Active")).toBeInTheDocument());
  });

  // UT15: Delete a Role with no Employees holding it, confirm dialog -> Role gone, redirected to list
  it("UT15: deletes the role and redirects to the list on confirm", async () => {
    mock.onGet("/roles/r1").reply(200, hrRole);
    mock.onDelete("/roles/r1").reply(200, {});

    renderWithClient(<RoleDetailPage roleId="r1" />);
    await screen.findByRole("heading", { name: "HR Generalist" });

    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: "Delete" }));
    const dialog = screen.getByRole("dialog", { name: "Delete Role" });
    await user.click(within(dialog).getByRole("button", { name: "Delete" }));

    await waitFor(() => expect(push).toHaveBeenCalledWith("/roles"));
  });

  // UT16: Delete a Role with an Employee holding it -> ROLE_HAS_EMPLOYEES shown
  it("UT16: shows ROLE_HAS_EMPLOYEES and does not remove or redirect", async () => {
    mock.onGet("/roles/r1").reply(200, hrRole);
    mock.onDelete("/roles/r1").reply(409, {
      error: { code: "ROLE_HAS_EMPLOYEES", message: "This role has employees." },
    });

    renderWithClient(<RoleDetailPage roleId="r1" />);
    await screen.findByRole("heading", { name: "HR Generalist" });

    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: "Delete" }));
    const dialog = screen.getByRole("dialog", { name: "Delete Role" });
    await user.click(within(dialog).getByRole("button", { name: "Delete" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "This role has employees holding it and cannot be deleted.",
    );
    expect(push).not.toHaveBeenCalled();
    expect(screen.getByRole("heading", { name: "HR Generalist" })).toBeInTheDocument();
  });
});
