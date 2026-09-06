import { useQuery } from "@tanstack/react-query";
import {
  getLocation,
  getLocationDepartments,
  getLocations,
} from "./locations.api";
import type { LocationFilters } from "./locations.api";

export function useLocationsQuery(filters: LocationFilters = {}) {
  return useQuery({
    queryKey: ["locations", filters],
    queryFn: () => getLocations(filters),
  });
}

export function useLocationQuery(id: string) {
  return useQuery({
    queryKey: ["locations", id],
    queryFn: () => getLocation(id),
    enabled: Boolean(id),
  });
}

export function useLocationDepartmentsQuery(id: string) {
  return useQuery({
    queryKey: ["locations", id, "departments"],
    queryFn: () => getLocationDepartments(id),
    enabled: Boolean(id),
  });
}
