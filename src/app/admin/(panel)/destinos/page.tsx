import { DestinationsDb, DestinationsDemo } from "@/components/admin/sources";
import { STATIC_DEMO } from "@/lib/config";
import { requireUser } from "@/lib/admin/session";
import { listDestinations } from "@/lib/repo/destinos";

export default async function DestinationsPage() {
  if (STATIC_DEMO) return <DestinationsDemo />;
  await requireUser();
  return <DestinationsDb initial={await listDestinations({ all: true })} />;
}
