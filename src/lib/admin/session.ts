import "server-only";
import { NextResponse } from "next/server";
import { redirect } from "next/navigation";
import { auth } from "@/auth";

export interface AdminSessionUser {
  id: string;
  name: string;
  email: string;
}

/** Sesión actual o null. */
export async function currentUser(): Promise<AdminSessionUser | null> {
  const session = await auth();
  const u = session?.user;
  if (!u?.id) return null;
  return { id: u.id, name: u.name ?? "", email: u.email ?? "" };
}

/** Para páginas del admin: redirige al login si no hay sesión. */
export async function requireUser(): Promise<AdminSessionUser> {
  const user = await currentUser();
  if (!user) redirect("/admin/login");
  return user;
}

/** Para rutas /api/admin/*: devuelve el usuario o una respuesta 401 lista para devolver. */
export async function requireApiUser(): Promise<{ user: AdminSessionUser; error?: undefined } | { user?: undefined; error: NextResponse }> {
  const user = await currentUser();
  if (!user) return { error: NextResponse.json({ ok: false, error: "No autorizado" }, { status: 401 }) };
  return { user };
}
