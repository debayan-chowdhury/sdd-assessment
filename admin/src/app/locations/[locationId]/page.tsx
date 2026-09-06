import { LocationDetailPage } from "@/screens/locations/LocationDetailPage";

export default async function Page({
  params,
}: PageProps<"/locations/[locationId]">) {
  const { locationId } = await params;
  return <LocationDetailPage locationId={locationId} />;
}
