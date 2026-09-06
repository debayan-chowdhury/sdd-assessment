import { api } from "@/lib/axios";
import type { Employee } from "@/types/employee";

export type LoginRequest = {
  email: string;
  password: string;
};

export type LoginResponse = {
  token: string;
  employee: Employee;
};

export function login(payload: LoginRequest) {
  return api.post<LoginResponse>("/auth/login", payload).then((res) => res.data);
}

export type ProfileResponse = {
  id: string;
  name: string;
  email: string;
  locationId: string;
  locationName: string | null;
  departmentId: string;
  departmentName: string | null;
  roleId: string;
  roleName: string | null;
  roleCategory: Employee["roleCategory"];
  managerId: string | null;
  managerName: string | null;
  hrId: string | null;
  hrName: string | null;
  mustChangePassword: boolean;
};

export function fetchProfile() {
  return api.get<ProfileResponse>("/auth/profile").then((res) => res.data);
}

export type ChangePasswordRequest = {
  currentPassword: string;
  newPassword: string;
};

export type ChangePasswordResponse = {
  message: string;
};

export function changePassword(payload: ChangePasswordRequest) {
  return api.post<ChangePasswordResponse>("/auth/change-password", payload).then((res) => res.data);
}
