export type RoleCategory = "HR" | "Manager" | "Payroll" | "IT" | "Facilities" | null;

export type Employee = {
  id: string;
  name: string;
  email: string;
  locationId: string;
  departmentId: string;
  roleId: string;
  roleCategory: RoleCategory;
  managerId: string | null;
  hrId: string | null;
  mustChangePassword: boolean;
};
