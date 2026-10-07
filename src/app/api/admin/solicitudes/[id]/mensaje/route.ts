import { NextResponse } from "next/server";
import { requireApiUser } from "@/lib/admin/session";
import { parseBody } from "@/lib/admin/api-utils";
import { getSolicitud } from "@/lib/repo/solicitudes";
import { getSiteContent } from "@/lib/content";
import { mailConfigured, sendClientMessage } from "@/lib/mailer";
import { adminMessageSchema } from "@/lib/validation-admin";

export const runtime = "nodejs";

/** Envía al cliente un correo redactado desde el panel (plantilla clientMessageEmail) y deja traza. */
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await requireApiUser();
  if (error) return error;
  const { data, error: bad } = await parseBody(req, adminMessageSchema);
  if (bad) return bad;
  const request = await getSolicitud((await params).id);
  if (!request) return NextResponse.json({ ok: false, error: "No existe" }, { status: 404 });
  if (!mailConfigured()) return NextResponse.json({ ok: false, error: "El correo no está configurado en el servidor (SMTP_*)." }, { status: 503 });
  const { brand } = await getSiteContent();
  const status = await sendClientMessage(request.id, request.data, data, brand);
  if (status !== "sent") return NextResponse.json({ ok: false, error: "No se pudo enviar el correo." }, { status: 502 });
  return NextResponse.json({ ok: true, to: request.data.contacto.email });
}
