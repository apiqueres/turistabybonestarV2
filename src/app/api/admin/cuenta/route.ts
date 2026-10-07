import { NextResponse } from "next/server";
import { requireApiUser } from "@/lib/admin/session";
import { passwordChangeSchema } from "@/lib/validation-admin";
import { changePassword } from "@/lib/repo/users";

export const runtime = "nodejs";

/** Cambio de contraseña del usuario con sesión. */
export async function POST(req: Request) {
  const { user, error } = await requireApiUser();
  if (error) return error;
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "JSON inválido" }, { status: 400 });
  }
  const parsed = passwordChangeSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ ok: false, error: parsed.error.issues[0]?.message ?? "Datos incompletos" }, { status: 400 });
  const result = await changePassword(user.id, parsed.data.current, parsed.data.next);
  if (result === "wrong-password") return NextResponse.json({ ok: false, error: "La contraseña actual no es correcta." }, { status: 400 });
  return NextResponse.json({ ok: true });
}
