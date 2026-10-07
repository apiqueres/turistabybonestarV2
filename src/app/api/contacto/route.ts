import { NextResponse, after } from "next/server";
import { contactoSchema } from "@/lib/validation";
import { createContacto } from "@/lib/repo/contactos";
import { getSiteContent } from "@/lib/content";
import { notifyAgencyContact } from "@/lib/mailer";
import { allow, clientIp, isHoneypotFilled } from "@/lib/rate-limit";

export const runtime = "nodejs";

/** Recibe el formulario corto de contacto, lo guarda y avisa a la agencia por correo. */
export async function POST(req: Request) {
  if (!allow(`contacto:${clientIp(req)}`)) {
    return NextResponse.json({ ok: false, error: "Demasiados mensajes seguidos. Espera unos minutos." }, { status: 429 });
  }
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "JSON inválido" }, { status: 400 });
  }
  if (isHoneypotFilled(body)) return NextResponse.json({ ok: true, id: "ok" });
  const parsed = contactoSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: "Datos incompletos", issues: parsed.error.issues }, { status: 400 });
  }
  try {
    const record = await createContacto(parsed.data);
    after(async () => {
      const { brand } = await getSiteContent();
      await notifyAgencyContact(record.id, parsed.data, brand);
    });
    return NextResponse.json({ ok: true, id: record.id });
  } catch (err) {
    console.error("[contacto] no se pudo guardar", err);
    return NextResponse.json({ ok: false, error: "No se pudo guardar" }, { status: 500 });
  }
}
