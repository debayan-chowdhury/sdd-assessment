import { DataTable } from "@/components/ui/DataTable";
import { StatusBadge } from "@/components/ui/StatusBadge";
import type { Department } from "@/types/department";

type DepartmentTableProps = {
  departments: Department[];
  onRowClick: (department: Department) => void;
};

export function DepartmentTable({
  departments,
  onRowClick,
}: DepartmentTableProps) {
  return (
    <DataTable
      rows={departments}
      rowKey={(department) => department.id}
      onRowClick={onRowClick}
      emptyMessage="No departments found."
      columns={[
        { key: "name", header: "Name", cell: (department) => department.name },
        { key: "code", header: "Code", cell: (department) => department.code },
        {
          key: "status",
          header: "Status",
          cell: (department) => <StatusBadge isActive={department.isActive} />,
        },
      ]}
    />
  );
}
