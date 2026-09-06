import { RoleDetailPage } from "@/screens/roles/RoleDetailPage";

export default async function Page({
  params,
}: PageProps<"/roles/[roleId]">) {
  const { roleId } = await params;
  return <RoleDetailPage roleId={roleId} />;
}
