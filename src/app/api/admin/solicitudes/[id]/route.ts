import { NextResponse } from "next/server";
import { requireApiRole, requireApiUser } from "@/lib/admin/session";
import { dbError, parseBody } from "@/lib/admin/api-utils";
import { deleteSolicitud, getSolicitud, updateSolicitud } from "@/lib/repo/solicitudes";
import { requestPatchSchema } from "@/lib/validation-admin";

export const runtime = "nodejs";
type Ctx = { params: Promise<{ id: string }> };

/** Una solicitud (un gestor solo puede leer las suyas). */
export async function GET(_req: Request, { params }: Ctx) {
  const { user, error } = await requireApiUser();
  if (error) return error;
  const row = await getSolicitud((await params).id, user);
  return row ? NextResponse.json({ ok: true, request: row }) : NextResponse.json({ ok: false, error: "No existe" }, { status: 404 });
}

/** Cambia el estado y/o las notas internas (un gestor solo las de su cartera). */
export async function PATCH(req: Request, { params }: Ctx) {
  const { user, error } = await requireApiUser();
  if (error) return error;
  const { data, error: bad } = await parseBody(req, requestPatchSchema);
  if (bad) return bad;
  try {
    const request = await updateSolicitud((await params).id, data, user);
    return request ? NextResponse.json({ ok: true, request }) : NextResponse.json({ ok: false, error: "No existe" }, { status: 404 });
  } catch (err) {
    return dbError("admin/solicitudes", err);
  }
}

/** Borrado real de la solicitud y sus correos (RGPD). Solo admin. */
export async function DELETE(_req: Request, { params }: Ctx) {
  const { error } = await requireApiRole("admin");
  if (error) return error;
  try {
    await deleteSolicitud((await params).id);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return dbError("admin/solicitudes", err);
  }
}
