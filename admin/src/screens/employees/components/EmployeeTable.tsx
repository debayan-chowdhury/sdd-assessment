import { DataTable } from "@/components/ui/DataTable";
import { StatusBadge } from "@/components/ui/StatusBadge";
import type { Employee } from "@/types/employee";

type EmployeeTableProps = {
  employees: Employee[];
  onRowClick: (employee: Employee) => void;
};

export function EmployeeTable({ employees, onRowClick }: EmployeeTableProps) {
  return (
    <DataTable
      rows={employees}
      rowKey={(employee) => employee.id}
      onRowClick={onRowClick}
      emptyMessage="No employees found."
      columns={[
        { key: "name", header: "Name", cell: (employee) => employee.name },
        { key: "email", header: "Email", cell: (employee) => employee.email },
        {
          key: "status",
          header: "Status",
          cell: (employee) => <StatusBadge isActive={employee.isActive} />,
        },
      ]}
    />
  );
}
