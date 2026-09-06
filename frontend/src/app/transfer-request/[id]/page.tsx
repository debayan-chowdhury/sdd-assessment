import { TransferRequestStatusScreen } from "@/screens/transfer-request/TransferRequestStatusScreen";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <TransferRequestStatusScreen id={id} />;
}
