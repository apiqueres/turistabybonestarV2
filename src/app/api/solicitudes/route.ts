import { NextResponse, after } from "next/server";
import { solicitudSchema } from "@/lib/validation";
import { createSolicitud } from "@/lib/repo/solicitudes";
import { getSiteContent } from "@/lib/content";
import { notifyAgencyRequest, sendClientConfirmation } from "@/lib/mailer";
import { allow, clientIp, isHoneypotFilled } from "@/lib/rate-limit";

export const runtime = "nodejs";

/**
 * Recibe el asistente «Cómo viajas»: valida con zod, guarda la solicitud y su brief en la base de datos
 * y, ya con la respuesta enviada, manda la confirmación al cliente y el aviso a la agencia.
 */
export async function POST(req: Request) {
  if (!allow(`solicitudes:${clientIp(req)}`)) {
    return NextResponse.json({ ok: false, error: "Demasiadas solicitudes seguidas. Espera unos minutos." }, { status: 429 });
  }
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "JSON inválido" }, { status: 400 });
  }
  if (isHoneypotFilled(body)) return NextResponse.json({ ok: true, id: "ok" });
  const parsed = solicitudSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: "Datos incompletos", issues: parsed.error.issues }, { status: 400 });
  }
  try {
    const record = await createSolicitud(parsed.data);
    after(async () => {
      const { brand } = await getSiteContent();
      await Promise.all([
        sendClientConfirmation(record.id, parsed.data, brand),
        notifyAgencyRequest(record.id, record.createdAt, parsed.data, record.prompt, brand),
      ]);
    });
    return NextResponse.json({ ok: true, id: record.id, prompt: record.prompt });
  } catch (err) {
    console.error("[solicitudes] no se pudo guardar", err);
    return NextResponse.json({ ok: false, error: "No se pudo guardar" }, { status: 500 });
  }
}
