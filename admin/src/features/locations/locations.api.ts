import { api } from "@/lib/axios";
import { toDepartment } from "@/features/departments/departments.api";
import type { Department } from "@/types/department";
import type { Location, LocationInput } from "@/types/location";

export type LocationFilters = {
  isActive?: boolean;
};

// Backend (Mongoose) documents key on `_id`, not `id` — normalize to the
// `id` shape the rest of the app is typed against.
type LocationDto = {
  _id: string;
  name: string;
  code: string;
  isActive: boolean;
};

type DepartmentDto = Parameters<typeof toDepartment>[0];

function toLocation(dto: LocationDto): Location {
  return { id: dto._id, name: dto.name, code: dto.code, isActive: dto.isActive };
}

export async function getLocations(
  filters: LocationFilters = {},
): Promise<Location[]> {
  const response = await api.get<LocationDto[]>("/locations", {
    params: filters,
  });
  return response.data.map(toLocation);
}

export async function getLocation(id: string): Promise<Location> {
  const response = await api.get<LocationDto>(`/locations/${id}`);
  return toLocation(response.data);
}

export async function createLocation(
  payload: LocationInput,
): Promise<Location> {
  const response = await api.post<LocationDto>("/locations", payload);
  return toLocation(response.data);
}

export async function updateLocation(
  id: string,
  payload: LocationInput,
): Promise<Location> {
  const response = await api.put<LocationDto>(`/locations/${id}`, payload);
  return toLocation(response.data);
}

export async function deleteLocation(id: string): Promise<void> {
  await api.delete(`/locations/${id}`);
}

export async function setLocationStatus(
  id: string,
  isActive: boolean,
): Promise<Location> {
  const response = await api.patch<LocationDto>(`/locations/${id}/status`, {
    isActive,
  });
  return toLocation(response.data);
}

export async function getLocationDepartments(
  id: string,
): Promise<Department[]> {
  const response = await api.get<DepartmentDto[]>(
    `/locations/${id}/departments`,
  );
  return response.data.map(toDepartment);
}

export async function addDepartmentMapping(
  locationId: string,
  departmentId: string,
): Promise<void> {
  await api.post(`/locations/${locationId}/departments`, { departmentId });
}

export async function removeDepartmentMapping(
  locationId: string,
  departmentId: string,
): Promise<void> {
  await api.delete(`/locations/${locationId}/departments/${departmentId}`);
}
