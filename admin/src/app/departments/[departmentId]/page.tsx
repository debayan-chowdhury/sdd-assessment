import { DepartmentDetailPage } from "@/screens/departments/DepartmentDetailPage";

export default async function Page({
  params,
}: PageProps<"/departments/[departmentId]">) {
  const { departmentId } = await params;
  return <DepartmentDetailPage departmentId={departmentId} />;
}
