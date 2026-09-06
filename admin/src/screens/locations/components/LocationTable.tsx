import { DataTable } from "@/components/ui/DataTable";
import { StatusBadge } from "@/components/ui/StatusBadge";
import type { Location } from "@/types/location";

type LocationTableProps = {
  locations: Location[];
  onRowClick: (location: Location) => void;
};

export function LocationTable({ locations, onRowClick }: LocationTableProps) {
  return (
    <DataTable
      rows={locations}
      rowKey={(location) => location.id}
      onRowClick={onRowClick}
      emptyMessage="No locations found."
      columns={[
        { key: "name", header: "Name", cell: (location) => location.name },
        { key: "code", header: "Code", cell: (location) => location.code },
        {
          key: "status",
          header: "Status",
          cell: (location) => <StatusBadge isActive={location.isActive} />,
        },
      ]}
    />
  );
}
