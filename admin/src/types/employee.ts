export type Employee = {
  id: string;
  name: string;
  email: string;
  isActive: boolean;
  locationId: string;
  departmentId: string;
  roleId: string;
  managerId: string | null;
  hrId: string | null;
  mustChangePassword?: boolean;
};

export type EmployeeInput = {
  name: string;
  email: string;
  locationId: string;
  departmentId: string;
  roleId: string;
  managerId: string | null;
  hrId: string | null;
};

// Create-only: the Admin sets the Employee's initial password directly
// (backend employee-crud-mapping.spec.md v1.3) — PUT never touches it.
export type EmployeeCreateInput = EmployeeInput & {
  password: string;
};
