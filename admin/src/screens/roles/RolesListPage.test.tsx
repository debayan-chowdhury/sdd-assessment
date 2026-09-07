import { afterEach, describe, expect, it, vi } from "vitest";
import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import MockAdapter from "axios-mock-adapter";
import { RolesListPage } from "./RolesListPage";
import { renderWithClient } from "@/test/render";
import { api } from "@/lib/axios";

// role-crud.spec.md — Unit Test Cases UT01-UT08 (create + list/filter behavior).
const push = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push, replace: vi.fn() }),
  usePathname: () => "/roles",
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

const engineer: RoleDto = {
  _id: "r1",
  name: "Engineer",
  code: "ENG",
  isActive: true,
  category: null,
};
const manager: RoleDto = {
  _id: "r2",
  name: "Store Manager",
  code: "SM",
  isActive: false,
  category: "Manager",
};
const hrGen: RoleDto = {
  _id: "r3",
  name: "HR Generalist",
  code: "HRG",
  isActive: true,
  category: "HR",
};

async function openCreateModal() {
  const user = userEvent.setup();
  await user.click(screen.getByRole("button", { name: "Add Role" }));
  return user;
}

async function fillAndSubmitCreateForm(
  user: ReturnType<typeof userEvent.setup>,
  { name, code, category }: { name: string; code: string; category?: "HR" | "Manager" },
) {
  const dialog = screen.getByRole("dialog", { name: "Add Role" });
  if (name) await user.type(within(dialog).getByLabelText("Name"), name);
  if (code) await user.type(within(dialog).getByLabelText("Code"), code);
  if (category) {
    await user.selectOptions(within(dialog).getByLabelText("Category"), category);
  }
  await user.click(within(dialog).getByRole("button", { name: "Save" }));
}

describe("RolesListPage", () => {
  // UT01: Submit create form with category "None" -> new row, no category badge
  it("UT01: creates a role with category None and shows it in the list with no category badge", async () => {
    mock.onGet("/roles", { params: {} }).replyOnce(200, []);
    mock
      .onPost("/roles", { name: "Engineer", code: "ENG", category: null })
      .reply(201, engineer);
    mock.onGet("/roles", { params: {} }).replyOnce(200, [engineer]);

    renderWithClient(<RolesListPage />);
    await waitFor(() => expect(screen.getByText("No roles found.")).toBeInTheDocument());

    const user = await openCreateModal();
    await fillAndSubmitCreateForm(user, { name: "Engineer", code: "ENG" });

    await waitFor(() =>
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument(),
    );
    const row = (await screen.findByText("Engineer")).closest("tr")!;
    expect(within(row).queryByText("HR")).not.toBeInTheDocument();
    expect(within(row).queryByText("Manager")).not.toBeInTheDocument();
  });

  // UT02: Submit create form with category "Manager" -> new row, "Manager" badge
  it("UT02: creates a role with category Manager and shows a Manager badge", async () => {
    mock.onGet("/roles", { params: {} }).replyOnce(200, []);
    mock
      .onPost("/roles", { name: "Store Manager", code: "SM", category: "Manager" })
      .reply(201, manager);
    mock.onGet("/roles", { params: {} }).replyOnce(200, [manager]);

    renderWithClient(<RolesListPage />);
    await waitFor(() => expect(screen.getByText("No roles found.")).toBeInTheDocument());

    const user = await openCreateModal();
    await fillAndSubmitCreateForm(user, {
      name: "Store Manager",
      code: "SM",
      category: "Manager",
    });

    const row = (await screen.findByText("Store Manager")).closest("tr")!;
    expect(within(row).getByText("Manager")).toBeInTheDocument();
  });

  // UT03: Submit create form with category "HR" -> new row, "HR" badge
  it("UT03: creates a role with category HR and shows an HR badge", async () => {
    mock.onGet("/roles", { params: {} }).replyOnce(200, []);
    mock
      .onPost("/roles", { name: "HR Generalist", code: "HRG", category: "HR" })
      .reply(201, hrGen);
    mock.onGet("/roles", { params: {} }).replyOnce(200, [hrGen]);

    renderWithClient(<RolesListPage />);
    await waitFor(() => expect(screen.getByText("No roles found.")).toBeInTheDocument());

    const user = await openCreateModal();
    await fillAndSubmitCreateForm(user, {
      name: "HR Generalist",
      code: "HRG",
      category: "HR",
    });

    const row = (await screen.findByText("HR Generalist")).closest("tr")!;
    expect(within(row).getByText("HR")).toBeInTheDocument();
  });

  // UT04: Submit create form with empty `code` -> inline VALIDATION_ERROR, no new row
  it("UT04: shows an inline validation error and creates no row when code is empty", async () => {
    mock.onGet("/roles", { params: {} }).reply(200, []);
    mock
      .onPost("/roles", { name: "Engineer", code: "", category: null })
      .reply(400, { error: { code: "VALIDATION_ERROR", message: "Code is required." } });

    renderWithClient(<RolesListPage />);
    await waitFor(() => expect(screen.getByText("No roles found.")).toBeInTheDocument());

    const user = await openCreateModal();
    await fillAndSubmitCreateForm(user, { name: "Engineer", code: "" });

    expect(await screen.findByRole("alert")).toHaveTextContent("Code is required.");
    expect(screen.getByRole("dialog", { name: "Add Role" })).toBeInTheDocument();
    expect(screen.getByText("No roles found.")).toBeInTheDocument();
  });

  // UT05: Submit create form with duplicate `code` -> inline DUPLICATE_CODE
  it("UT05: shows an inline DUPLICATE_CODE error on the code field", async () => {
    mock.onGet("/roles", { params: {} }).reply(200, [engineer]);
    mock
      .onPost("/roles", { name: "Engineer Two", code: "ENG", category: null })
      .reply(409, {
        error: { code: "DUPLICATE_CODE", message: "This code is already in use." },
      });

    renderWithClient(<RolesListPage />);
    await screen.findByText("Engineer");

    const user = await openCreateModal();
    await fillAndSubmitCreateForm(user, { name: "Engineer Two", code: "ENG" });

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "This code is already in use.",
    );
  });

  // UT06: Load list with mixed Roles, no filter -> all rows shown
  it("UT06: shows all roles regardless of status or category when no filter is applied", async () => {
    mock.onGet("/roles", { params: {} }).reply(200, [engineer, manager, hrGen]);

    renderWithClient(<RolesListPage />);

    expect(await screen.findByText("Engineer")).toBeInTheDocument();
    expect(screen.getByText("Store Manager")).toBeInTheDocument();
    expect(screen.getByText("HR Generalist")).toBeInTheDocument();
  });

  // UT07: Toggle "Active only" filter -> only active rows shown
  it("UT07: shows only active roles when the Active only filter is toggled on", async () => {
    mock.onGet("/roles", { params: {} }).reply(200, [engineer, manager, hrGen]);
    mock
      .onGet("/roles", { params: { isActive: true } })
      .reply(200, [engineer, hrGen]);

    renderWithClient(<RolesListPage />);
    await screen.findByText("Store Manager");

    const user = userEvent.setup();
    await user.click(screen.getByLabelText("Active only"));

    await waitFor(() =>
      expect(screen.queryByText("Store Manager")).not.toBeInTheDocument(),
    );
    expect(screen.getByText("Engineer")).toBeInTheDocument();
    expect(screen.getByText("HR Generalist")).toBeInTheDocument();
  });

  // UT08: Select "HR" category filter -> only HR-category rows shown
  it("UT08: shows only HR-category roles when the HR category filter is selected", async () => {
    mock.onGet("/roles", { params: {} }).reply(200, [engineer, manager, hrGen]);
    mock.onGet("/roles", { params: { category: "HR" } }).reply(200, [hrGen]);

    renderWithClient(<RolesListPage />);
    await screen.findByText("Engineer");

    const user = userEvent.setup();
    await user.selectOptions(screen.getByLabelText("Category"), "HR");

    await waitFor(() => expect(screen.queryByText("Engineer")).not.toBeInTheDocument());
    expect(screen.queryByText("Store Manager")).not.toBeInTheDocument();
    expect(screen.getByText("HR Generalist")).toBeInTheDocument();
  });
});
