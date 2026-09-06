import { EmployeeDetailPage } from "@/screens/employees/EmployeeDetailPage";

export default async function Page({
  params,
}: PageProps<"/employees/[employeeId]">) {
  const { employeeId } = await params;
  return <EmployeeDetailPage employeeId={employeeId} />;
}
