import { Suspense } from "react";
import { RequestsDb, RequestsDemo, type RequestFilter } from "@/components/admin/sources";
import { getFormContent, getSiteContent } from "@/lib/content";
import { STATIC_DEMO } from "@/lib/config";
import { requireUser } from "@/lib/admin/session";
import { listSolicitudes } from "@/lib/repo/solicitudes";

type Search = Promise<{ page?: string; estado?: string; q?: string }>;
const FILTERS: RequestFilter[] = ["todas", "nueva", "en-curso", "cerrada"];

export default async function RequestsPage({ searchParams }: { searchParams: Search }) {
  const { brand } = await getSiteContent();
  if (STATIC_DEMO) {
    // Exportación estática: la URL se lee en el navegador.
    return (
      <Suspense fallback={null}>
        <RequestsDemo brand={brand} />
      </Suspense>
    );
  }
  await requireUser();
  const sp = await searchParams;
  const filter = FILTERS.includes(sp.estado as RequestFilter) ? (sp.estado as RequestFilter) : "todas";
  const q = sp.q ?? "";
  const page = Number(sp.page) || 1;
  const [data, form] = await Promise.all([listSolicitudes({ page, status: filter, q }), getFormContent()]);
  return <RequestsDb data={data} filter={filter} q={q} steps={form.steps} brand={brand} />;
}
