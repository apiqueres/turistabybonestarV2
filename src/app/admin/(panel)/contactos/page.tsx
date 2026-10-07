import { notFound } from "next/navigation";
import { ContactsAdmin } from "@/components/admin/ContactsAdmin";
import { STATIC_DEMO } from "@/lib/config";
import { requireUser } from "@/lib/admin/session";
import { listContactos } from "@/lib/repo/contactos";

export default async function ContactsPage({ searchParams }: { searchParams: Promise<{ page?: string; pendientes?: string }> }) {
  if (STATIC_DEMO) notFound();
  await requireUser();
  const sp = await searchParams;
  const onlyPending = sp.pendientes === "1";
  const data = await listContactos({ page: Number(sp.page) || 1, pending: onlyPending });
  return <ContactsAdmin rows={data.rows} total={data.total} page={data.page} pending={data.pending} onlyPending={onlyPending} />;
}
