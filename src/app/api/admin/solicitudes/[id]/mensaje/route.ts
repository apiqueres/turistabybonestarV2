import { NextResponse } from "next/server";
import { requireApiUser } from "@/lib/admin/session";
import { parseBody } from "@/lib/admin/api-utils";
import { getSolicitud } from "@/lib/repo/solicitudes";
import { getSiteContent } from "@/lib/content";
import { sendClientMessage } from "@/lib/mailer";
import { adminMessageSchema } from "@/lib/validation-admin";

export const runtime = "nodejs";

/**
 * Envía al cliente un correo redactado en el panel. Sale con el Gmail del usuario en sesión
 * (From y Reply-To su dirección corporativa); si no lo ha conectado, con la cuenta de la agencia.
 */
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { user, error } = await requireApiUser();
  if (error) return error;
  const { data, error: bad } = await parseBody(req, adminMessageSchema);
  if (bad) return bad;
  const request = await getSolicitud((await params).id, user);
  if (!request) return NextResponse.json({ ok: false, error: "No existe" }, { status: 404 });
  const { brand } = await getSiteContent();
  const result = await sendClientMessage({ id: user.id, email: user.email }, request.id, request.data, data, brand);
  if (result.status !== "sent") {
    return NextResponse.json({ ok: false, error: `No se pudo enviar el correo. ${result.error ?? ""}`.trim() }, { status: 502 });
  }
  return NextResponse.json({ ok: true, to: request.data.contacto.email, viaAgency: result.viaAgency });
}
