import { NextResponse } from "next/server";
import { requireApiUser } from "@/lib/admin/session";
import { listSolicitudes } from "@/lib/repo/solicitudes";
import { requestStatusSchema } from "@/lib/validation-admin";

export const runtime = "nodejs";

/**
 * Listado paginado: ?page=1&estado=nueva|en-curso|cerrada|todas&gestor=todas|sin|<id>&q=texto
 * El filtro de gestor solo lo aplica el admin; un gestor siempre ve únicamente las suyas.
 */
export async function GET(req: Request) {
  const { user, error } = await requireApiUser();
  if (error) return error;
  const url = new URL(req.url);
  const estado = requestStatusSchema.safeParse(url.searchParams.get("estado"));
  const page = await listSolicitudes(user, {
    page: Number(url.searchParams.get("page")) || 1,
    status: estado.success ? estado.data : "todas",
    gestor: url.searchParams.get("gestor") ?? undefined,
    q: url.searchParams.get("q") ?? undefined,
  });
  return NextResponse.json({ ok: true, ...page });
}
