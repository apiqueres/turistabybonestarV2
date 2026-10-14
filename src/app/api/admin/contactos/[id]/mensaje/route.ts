import { NextResponse } from "next/server";
import { requireApiRole } from "@/lib/admin/session";
import { parseMessageWithFiles } from "@/lib/admin/api-utils";
import { getContacto, setContactoHandled } from "@/lib/repo/contactos";
import { getSiteContent } from "@/lib/content";
import { sendContactReply } from "@/lib/mailer";
import { adminMessageSchema } from "@/lib/validation-admin";

export const runtime = "nodejs";

/** Responde por correo a un mensaje de contacto desde el panel y lo marca como atendido. */
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { user, error } = await requireApiRole("admin");
  if (error) return error;
  const { data, files, error: bad } = await parseMessageWithFiles(req, adminMessageSchema);
  if (bad) return bad;
  const contact = await getContacto((await params).id);
  if (!contact) return NextResponse.json({ ok: false, error: "No existe" }, { status: 404 });
  const { brand } = await getSiteContent();
  const result = await sendContactReply({ id: user.id, email: user.email }, contact.id, contact.data, data, brand, files);
  if (result.status !== "sent") return NextResponse.json({ ok: false, error: `No se pudo enviar el correo. ${result.error ?? ""}`.trim() }, { status: 502 });
  await setContactoHandled(contact.id, true);
  return NextResponse.json({ ok: true, to: contact.data.email, viaAgency: result.viaAgency });
}
