import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ProfileScreen } from "@/screens/profile/ProfileScreen";

const useProfile = vi.fn();

vi.mock("@/features/auth/auth.queries", () => ({
  useProfile: () => useProfile(),
}));

describe("ProfileScreen", () => {
  it("renders nothing when the profile hasn't loaded", () => {
    useProfile.mockReturnValue({ data: undefined, isLoading: true });

    const { container } = render(<ProfileScreen />);

    expect(container).toBeEmptyDOMElement();
  });

  it("shows the employee's own profile details, Current Manager/HR names, and a link to change password", () => {
    useProfile.mockReturnValue({
      data: {
        id: "emp-1",
        name: "Jamie Employee",
        email: "jamie@example.com",
        locationId: "loc-1",
        locationName: "Delhi",
        departmentId: "dept-1",
        departmentName: "Finance",
        roleId: "role-1",
        roleName: "Analyst",
        roleCategory: "Manager",
        managerId: null,
        managerName: null,
        hrId: "hr-1",
        hrName: "Sam HR",
        mustChangePassword: false,
      },
      isLoading: false,
    });

    render(<ProfileScreen />);

    expect(screen.getByText("Jamie Employee")).toBeInTheDocument();
    expect(screen.getByText("jamie@example.com")).toBeInTheDocument();
    expect(screen.getByText("Analyst")).toBeInTheDocument();
    expect(screen.getByText("Manager")).toBeInTheDocument();
    expect(screen.getByText("Finance")).toBeInTheDocument();
    expect(screen.getByText("Delhi")).toBeInTheDocument();
    expect(screen.getByText("Sam HR")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Change password" })).toHaveAttribute("href", "/change-password");
  });

  it("shows a dash for Current Manager/HR when the employee (e.g. a Manager-category one) has none", () => {
    useProfile.mockReturnValue({
      data: {
        id: "emp-1",
        name: "Jamie Employee",
        email: "jamie@example.com",
        locationId: "loc-1",
        locationName: "Delhi",
        departmentId: "dept-1",
        departmentName: "Finance",
        roleId: "role-1",
        roleName: "Analyst",
        roleCategory: "Manager",
        managerId: null,
        managerName: null,
        hrId: null,
        hrName: null,
        mustChangePassword: false,
      },
      isLoading: false,
    });

    render(<ProfileScreen />);

    expect(screen.getByText("Current Manager:")).toBeInTheDocument();
    expect(screen.getByText("Current HR:")).toBeInTheDocument();
    expect(screen.getAllByText("—")).toHaveLength(2);
  });
});
