import { NextResponse } from "next/server";
import { requireApiUser } from "@/lib/admin/session";
import { parseBody } from "@/lib/admin/api-utils";
import { clearGmail, getMailSettings, saveGmail, setBccSelf } from "@/lib/repo/users";
import { sendGmailTest } from "@/lib/mailer";
import { bccSchema, gmailSchema } from "@/lib/validation-admin";

export const runtime = "nodejs";

/** Estado del correo del usuario (nunca devuelve la contraseña de aplicación). */
export async function GET() {
  const { user, error } = await requireApiUser({ allowPending: true });
  if (error) return error;
  return NextResponse.json({ ok: true, corporate: user.email, ...(await getMailSettings(user.id)) });
}

/**
 * Conecta el Gmail del usuario. Antes de guardar, envía un correo de prueba a ese Gmail con el remitente
 * corporativo; si Google rechaza la cuenta, no se guarda nada. La contraseña se cifra antes de persistirse.
 */
export async function POST(req: Request) {
  const { user, error } = await requireApiUser({ allowPending: true });
  if (error) return error;
  const { data, error: bad } = await parseBody(req, gmailSchema);
  if (bad) return bad;
  const test = await sendGmailTest({ user: data.gmailUser, pass: data.appPassword }, user.email);
  if (!test.ok) return NextResponse.json({ ok: false, error: test.error }, { status: 400 });
  try {
    await saveGmail(user.id, data.gmailUser, data.appPassword);
  } catch (err) {
    console.error("[cuenta/correo] no se pudo guardar la cuenta de Gmail", err);
    return NextResponse.json({ ok: false, error: "El servidor no puede guardar la clave (revisa APP_SECRET_KEY)." }, { status: 500 });
  }
  return NextResponse.json({ ok: true, ...(await getMailSettings(user.id)) });
}

/** Desconecta el Gmail y borra la contraseña de aplicación. */
export async function DELETE() {
  const { user, error } = await requireApiUser({ allowPending: true });
  if (error) return error;
  await clearGmail(user.id);
  return NextResponse.json({ ok: true, ...(await getMailSettings(user.id)) });
}

/** Activa o desactiva la copia oculta de cada correo que envía el usuario a su propia dirección. */
export async function PATCH(req: Request) {
  const { user, error } = await requireApiUser({ allowPending: true });
  if (error) return error;
  const { data, error: bad } = await parseBody(req, bccSchema);
  if (bad) return bad;
  await setBccSelf(user.id, data.bccSelf);
  return NextResponse.json({ ok: true, ...(await getMailSettings(user.id)) });
}
