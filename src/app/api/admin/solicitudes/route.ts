import { NextResponse } from "next/server";
import { requireApiUser } from "@/lib/admin/session";
import { listSolicitudes } from "@/lib/repo/solicitudes";
import { requestStatusSchema } from "@/lib/validation-admin";

export const runtime = "nodejs";

/** Listado paginado: ?page=1&estado=nueva|en-curso|cerrada|todas&q=texto */
export async function GET(req: Request) {
  const { error } = await requireApiUser();
  if (error) return error;
  const url = new URL(req.url);
  const estado = requestStatusSchema.safeParse(url.searchParams.get("estado"));
  const page = await listSolicitudes({
    page: Number(url.searchParams.get("page")) || 1,
    status: estado.success ? estado.data : "todas",
    q: url.searchParams.get("q") ?? undefined,
  });
  return NextResponse.json({ ok: true, ...page });
}
