import { NextResponse } from "next/server";
import { requireApiRole } from "@/lib/admin/session";
import { listUsers } from "@/lib/repo/users";

export const runtime = "nodejs";

/** Los usuarios del panel, sin contraseñas ni claves de Gmail. Solo admin. */
export async function GET() {
  const { error } = await requireApiRole("admin");
  if (error) return error;
  return NextResponse.json({ ok: true, users: await listUsers() });
}
