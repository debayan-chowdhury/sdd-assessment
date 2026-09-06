import { api } from "@/lib/axios";
import { toRole } from "@/features/roles/roles.api";
import type { Role } from "@/types/role";
import type { Department, DepartmentInput } from "@/types/department";

export type DepartmentFilters = {
  isActive?: boolean;
};

// Backend (Mongoose) documents key on `_id`, not `id` — normalize to the
// `id` shape the rest of the app is typed against.
type DepartmentDto = {
  _id: string;
  name: string;
  code: string;
  isActive: boolean;
};

type RoleDto = Parameters<typeof toRole>[0];

export function toDepartment(dto: DepartmentDto): Department {
  return { id: dto._id, name: dto.name, code: dto.code, isActive: dto.isActive };
}

export async function getDepartments(
  filters: DepartmentFilters = {},
): Promise<Department[]> {
  const response = await api.get<DepartmentDto[]>("/departments", {
    params: filters,
  });
  return response.data.map(toDepartment);
}

export async function getDepartment(id: string): Promise<Department> {
  const response = await api.get<DepartmentDto>(`/departments/${id}`);
  return toDepartment(response.data);
}

export async function createDepartment(
  payload: DepartmentInput,
): Promise<Department> {
  const response = await api.post<DepartmentDto>("/departments", payload);
  return toDepartment(response.data);
}

export async function updateDepartment(
  id: string,
  payload: DepartmentInput,
): Promise<Department> {
  const response = await api.put<DepartmentDto>(`/departments/${id}`, payload);
  return toDepartment(response.data);
}

export async function deleteDepartment(id: string): Promise<void> {
  await api.delete(`/departments/${id}`);
}

export async function setDepartmentStatus(
  id: string,
  isActive: boolean,
): Promise<Department> {
  const response = await api.patch<DepartmentDto>(
    `/departments/${id}/status`,
    { isActive },
  );
  return toDepartment(response.data);
}

export async function getDepartmentRoles(id: string): Promise<Role[]> {
  const response = await api.get<RoleDto[]>(`/departments/${id}/roles`);
  return response.data.map(toRole);
}

export async function addRoleMapping(
  departmentId: string,
  roleId: string,
): Promise<void> {
  await api.post(`/departments/${departmentId}/roles`, { roleId });
}

export async function removeRoleMapping(
  departmentId: string,
  roleId: string,
): Promise<void> {
  await api.delete(`/departments/${departmentId}/roles/${roleId}`);
}
