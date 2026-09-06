import { api } from "@/lib/axios";
import type { Role, RoleInput } from "@/types/role";

export type RoleFilters = {
  isActive?: boolean;
  category?: "HR" | "Manager";
};

// Backend (Mongoose) documents key on `_id`, not `id` — normalize to the
// `id` shape the rest of the app is typed against.
type RoleDto = {
  _id: string;
  name: string;
  code: string;
  isActive: boolean;
  category: "HR" | "Manager" | null;
};

export function toRole(dto: RoleDto): Role {
  return {
    id: dto._id,
    name: dto.name,
    code: dto.code,
    isActive: dto.isActive,
    category: dto.category,
  };
}

export async function getRoles(filters: RoleFilters = {}): Promise<Role[]> {
  const response = await api.get<RoleDto[]>("/roles", { params: filters });
  return response.data.map(toRole);
}

export async function getRole(id: string): Promise<Role> {
  const response = await api.get<RoleDto>(`/roles/${id}`);
  return toRole(response.data);
}

export async function createRole(payload: RoleInput): Promise<Role> {
  const response = await api.post<RoleDto>("/roles", payload);
  return toRole(response.data);
}

export async function updateRole(
  id: string,
  payload: RoleInput,
): Promise<Role> {
  const response = await api.put<RoleDto>(`/roles/${id}`, payload);
  return toRole(response.data);
}

export async function deleteRole(id: string): Promise<void> {
  await api.delete(`/roles/${id}`);
}

export async function setRoleStatus(
  id: string,
  isActive: boolean,
): Promise<Role> {
  const response = await api.patch<RoleDto>(`/roles/${id}/status`, {
    isActive,
  });
  return toRole(response.data);
}
