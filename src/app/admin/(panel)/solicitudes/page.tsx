import { Suspense } from "react";
import { RequestsDb, RequestsDemo, type RequestFilter } from "@/components/admin/sources";
import { getFormContent, getSiteContent } from "@/lib/content";
import { STATIC_DEMO } from "@/lib/config";
import { requireUser } from "@/lib/admin/session";
import { listSolicitudes } from "@/lib/repo/solicitudes";
import { listAssignees } from "@/lib/repo/users";

type Search = Promise<{ page?: string; estado?: string; gestor?: string; q?: string }>;
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
  const user = await requireUser();
  const sp = await searchParams;
  const filter = FILTERS.includes(sp.estado as RequestFilter) ? (sp.estado as RequestFilter) : "todas";
  const q = sp.q ?? "";
  const page = Number(sp.page) || 1;
  // Solo el admin filtra por gestor; para un gestor el repositorio ya limita a sus solicitudes.
  const gestor = user.role === "admin" ? (sp.gestor ?? "todas") : "todas";
  const [data, form, gestores] = await Promise.all([
    listSolicitudes(user, { page, status: filter, q, gestor }),
    getFormContent(),
    user.role === "admin" ? listAssignees() : Promise.resolve([]),
  ]);
  return (
    <RequestsDb
      data={data}
      filter={filter}
      q={q}
      gestor={gestor}
      gestores={gestores}
      viewer={{ id: user.id, role: user.role }}
      steps={form.steps}
      brand={brand}
    />
  );
}
