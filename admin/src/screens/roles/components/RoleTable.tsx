import { DataTable } from "@/components/ui/DataTable";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { CategoryBadge } from "@/components/ui/CategoryBadge";
import type { Role } from "@/types/role";

type RoleTableProps = {
  roles: Role[];
  onRowClick: (role: Role) => void;
};

export function RoleTable({ roles, onRowClick }: RoleTableProps) {
  return (
    <DataTable
      rows={roles}
      rowKey={(role) => role.id}
      onRowClick={onRowClick}
      emptyMessage="No roles found."
      columns={[
        { key: "name", header: "Name", cell: (role) => role.name },
        { key: "code", header: "Code", cell: (role) => role.code },
        {
          key: "category",
          header: "Category",
          cell: (role) => <CategoryBadge category={role.category} />,
        },
        {
          key: "status",
          header: "Status",
          cell: (role) => <StatusBadge isActive={role.isActive} />,
        },
      ]}
    />
  );
}
