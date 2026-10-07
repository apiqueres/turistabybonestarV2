import { NextResponse } from "next/server";
import { requireApiUser } from "@/lib/admin/session";
import { dbError, parseBody } from "@/lib/admin/api-utils";
import { deleteSolicitud, getSolicitud, updateSolicitud } from "@/lib/repo/solicitudes";
import { requestPatchSchema } from "@/lib/validation-admin";

export const runtime = "nodejs";
type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: Request, { params }: Ctx) {
  const { error } = await requireApiUser();
  if (error) return error;
  const row = await getSolicitud((await params).id);
  return row ? NextResponse.json({ ok: true, request: row }) : NextResponse.json({ ok: false, error: "No existe" }, { status: 404 });
}

/** Cambia el estado y/o las notas internas. */
export async function PATCH(req: Request, { params }: Ctx) {
  const { error } = await requireApiUser();
  if (error) return error;
  const { data, error: bad } = await parseBody(req, requestPatchSchema);
  if (bad) return bad;
  try {
    return NextResponse.json({ ok: true, request: await updateSolicitud((await params).id, data) });
  } catch (err) {
    return dbError("admin/solicitudes", err);
  }
}

/** Borrado real de la solicitud y sus correos (RGPD). */
export async function DELETE(_req: Request, { params }: Ctx) {
  const { error } = await requireApiUser();
  if (error) return error;
  try {
    await deleteSolicitud((await params).id);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return dbError("admin/solicitudes", err);
  }
}
