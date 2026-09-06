export type RoleCategory = "HR" | "Manager" | null;

export type Role = {
  id: string;
  name: string;
  code: string;
  isActive: boolean;
  category: RoleCategory;
};

export type RoleInput = {
  name: string;
  code: string;
  category: RoleCategory;
};
