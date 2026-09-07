import { afterEach, describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import MockAdapter from "axios-mock-adapter";
import { DepartmentFormModal } from "./DepartmentFormModal";
import { renderWithClient } from "@/test/render";
import { api } from "@/lib/axios";

// department-crud.spec.md — Unit Test Cases UT03, UT08.
const mock = new MockAdapter(api);

afterEach(() => {
  mock.reset();
});

describe("DepartmentFormModal", () => {
  // UT03: Submit create form with duplicate `code` -> Inline DUPLICATE_CODE
  it("UT03: shows inline DUPLICATE_CODE when creating with a duplicate code", async () => {
    mock.onPost("/departments").reply(409, {
      error: { code: "DUPLICATE_CODE", message: "This code is taken." },
    });

    renderWithClient(
      <DepartmentFormModal isOpen onClose={vi.fn()} mode="create" />,
    );

    const user = userEvent.setup();
    await user.type(screen.getByLabelText("Name"), "Engineering");
    await user.type(screen.getByLabelText("Code"), "ENG");
    await user.click(screen.getByRole("button", { name: "Save" }));

    expect(await screen.findByText("This code is already in use.")).toBeInTheDocument();
  });

  // UT08: Submit edit form with a duplicate code -> Inline DUPLICATE_CODE, no update
  it("UT08: shows inline DUPLICATE_CODE when editing with a code used by another department and does not close", async () => {
    const onClose = vi.fn();
    const department = { id: "d1", name: "Engineering", code: "ENG", isActive: true };
    mock.onPut("/departments/d1").reply(409, {
      error: { code: "DUPLICATE_CODE", message: "This code is taken." },
    });

    renderWithClient(
      <DepartmentFormModal
        isOpen
        onClose={onClose}
        mode="edit"
        department={department}
      />,
    );

    const user = userEvent.setup();
    const codeInput = screen.getByLabelText("Code");
    await user.clear(codeInput);
    await user.type(codeInput, "DUP");
    await user.click(screen.getByRole("button", { name: "Save" }));

    expect(await screen.findByText("This code is already in use.")).toBeInTheDocument();
    expect(onClose).not.toHaveBeenCalled();
  });
});
