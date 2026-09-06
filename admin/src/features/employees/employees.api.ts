import { api } from "@/lib/axios";
import type { Employee, EmployeeCreateInput, EmployeeInput } from "@/types/employee";

export type EmployeeFilters = {
  isActive?: boolean;
  locationId?: string;
  departmentId?: string;
  roleId?: string;
};

// Backend (Mongoose) documents key on `_id`, not `id` — normalize to the
// `id` shape the rest of the app is typed against.
type EmployeeDto = {
  _id: string;
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

function toEmployee(dto: EmployeeDto): Employee {
  return {
    id: dto._id,
    name: dto.name,
    email: dto.email,
    isActive: dto.isActive,
    locationId: dto.locationId,
    departmentId: dto.departmentId,
    roleId: dto.roleId,
    managerId: dto.managerId,
    hrId: dto.hrId,
    mustChangePassword: dto.mustChangePassword,
  };
}

export async function getEmployees(
  filters: EmployeeFilters = {},
): Promise<Employee[]> {
  const response = await api.get<EmployeeDto[]>("/employees", {
    params: filters,
  });
  return response.data.map(toEmployee);
}

export async function getEmployee(id: string): Promise<Employee> {
  const response = await api.get<EmployeeDto>(`/employees/${id}`);
  return toEmployee(response.data);
}

export async function createEmployee(
  payload: EmployeeCreateInput,
): Promise<Employee> {
  const response = await api.post<EmployeeDto>("/employees", payload);
  return toEmployee(response.data);
}

export async function updateEmployee(
  id: string,
  payload: EmployeeInput,
): Promise<Employee> {
  const response = await api.put<EmployeeDto>(`/employees/${id}`, payload);
  return toEmployee(response.data);
}

export async function deleteEmployee(id: string): Promise<void> {
  await api.delete(`/employees/${id}`);
}

export async function setEmployeeStatus(
  id: string,
  isActive: boolean,
): Promise<Employee> {
  const response = await api.patch<EmployeeDto>(`/employees/${id}/status`, {
    isActive,
  });
  return toEmployee(response.data);
}
