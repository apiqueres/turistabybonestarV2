import { NextResponse } from "next/server";
import { requireApiRole } from "@/lib/admin/session";
import { dbError, parseBody } from "@/lib/admin/api-utils";
import { assignSolicitud, getSolicitud } from "@/lib/repo/solicitudes";
import { getAccount } from "@/lib/repo/users";
import { getSiteContent } from "@/lib/content";
import { notifyAssignee } from "@/lib/mailer";
import { assignSchema } from "@/lib/validation-admin";

export const runtime = "nodejs";

/**
 * Asigna o reasigna la solicitud a un gestor (null = sin asignar). Solo admin.
 * Al asignar, el gestor recibe un aviso con el brief; si el aviso falla, la asignación se mantiene
 * y la respuesta lo indica en `aviso`.
 */
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { user, error } = await requireApiRole("admin");
  if (error) return error;
  const { data, error: bad } = await parseBody(req, assignSchema);
  if (bad) return bad;
  const { id } = await params;
  const current = await getSolicitud(id, user);
  if (!current) return NextResponse.json({ ok: false, error: "No existe" }, { status: 404 });

  const gestor = data.gestorId ? await getAccount(data.gestorId) : null;
  if (data.gestorId && (!gestor || !gestor.active)) {
    return NextResponse.json({ ok: false, error: "El gestor indicado no existe o está desactivado." }, { status: 400 });
  }
  try {
    const request = await assignSolicitud(id, gestor?.id ?? null);
    let aviso: "sent" | "error" | null = null;
    if (gestor) {
      const { brand } = await getSiteContent();
      aviso = await notifyAssignee(id, current.createdAt, current.data, current.prompt ?? "", gestor.email, brand);
    }
    return NextResponse.json({ ok: true, request, aviso });
  } catch (err) {
    return dbError("admin/asignar", err);
  }
}
