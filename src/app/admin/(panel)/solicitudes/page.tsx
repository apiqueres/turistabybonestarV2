import { RequestsAdmin } from "@/components/admin/RequestsAdmin";
import { getSiteContent } from "@/lib/content";

export default async function RequestsPage() {
  const { brand } = await getSiteContent();
  return <RequestsAdmin brand={brand} />;
}
