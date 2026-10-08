import { NextResponse } from "next/server";
import { requireApiUser } from "@/lib/admin/session";
import { parseBody } from "@/lib/admin/api-utils";
import { getContacto, setContactoHandled } from "@/lib/repo/contactos";
import { getSiteContent } from "@/lib/content";
import { mailConfigured, sendContactReply } from "@/lib/mailer";
import { adminMessageSchema } from "@/lib/validation-admin";

export const runtime = "nodejs";

/** Responde por correo a un mensaje de contacto desde el panel y lo marca como atendido. */
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await requireApiUser();
  if (error) return error;
  const { data, error: bad } = await parseBody(req, adminMessageSchema);
  if (bad) return bad;
  const contact = await getContacto((await params).id);
  if (!contact) return NextResponse.json({ ok: false, error: "No existe" }, { status: 404 });
  if (!mailConfigured()) return NextResponse.json({ ok: false, error: "El correo no está configurado en el servidor (SMTP_*)." }, { status: 503 });
  const { brand } = await getSiteContent();
  const status = await sendContactReply(contact.id, contact.data, data, brand);
  if (status !== "sent") return NextResponse.json({ ok: false, error: "No se pudo enviar el correo." }, { status: 502 });
  await setContactoHandled(contact.id, true);
  return NextResponse.json({ ok: true, to: contact.data.email });
}
