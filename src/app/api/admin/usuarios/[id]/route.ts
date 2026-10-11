import { NextResponse } from "next/server";
import { requireApiRole } from "@/lib/admin/session";
import { dbError, parseBody } from "@/lib/admin/api-utils";
import { setUserActive } from "@/lib/repo/users";
import { userActiveSchema } from "@/lib/validation-admin";

export const runtime = "nodejs";

/** Activa o desactiva una cuenta. Solo admin; nadie puede desactivarse a sí mismo. */
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { user, error } = await requireApiRole("admin");
  if (error) return error;
  const { data, error: bad } = await parseBody(req, userActiveSchema);
  if (bad) return bad;
  try {
    const result = await setUserActive((await params).id, data.active, user.id);
    if (result === "self") return NextResponse.json({ ok: false, error: "No puedes desactivar tu propia cuenta." }, { status: 400 });
    return NextResponse.json({ ok: true });
  } catch (err) {
    return dbError("admin/usuarios", err);
  }
}
