import { NextResponse } from "next/server";
import { requireApiRole } from "@/lib/admin/session";
import { dbError } from "@/lib/admin/api-utils";
import { resetPassword } from "@/lib/repo/users";

export const runtime = "nodejs";

/**
 * Restablece la contraseña de un usuario con una temporal que se devuelve una sola vez.
 * Al entrar, el usuario debe cambiarla. Solo admin.
 */
export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await requireApiRole("admin");
  if (error) return error;
  try {
    const temporal = await resetPassword((await params).id);
    return NextResponse.json({ ok: true, temporal });
  } catch (err) {
    return dbError("admin/usuarios", err);
  }
}
