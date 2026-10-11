import "server-only";
import { NextResponse } from "next/server";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { getAccount, type AdminAccount } from "@/lib/repo/users";
import type { AdminRole } from "@/generated/prisma/client";

export type AdminSessionUser = AdminAccount;

interface Options {
  /** Solo este rol. Los demás: 403 en la API y redirección a Solicitudes en las páginas. */
  role?: AdminRole;
  /** Deja pasar aunque la contraseña esté pendiente de cambiar (solo «Mi cuenta»). */
  allowPending?: boolean;
}

/**
 * Cuenta actual según la base de datos: rol, activa y cambio de contraseña pendiente siempre al día.
 * Devuelve null si no hay sesión, si la cuenta no existe o si está desactivada.
 */
export async function currentUser(): Promise<AdminSessionUser | null> {
  const session = await auth();
  if (!session?.user?.id) return null;
  const account = await getAccount(session.user.id);
  return account?.active ? account : null;
}

/** Para páginas del admin: redirige al login, a «Mi cuenta» (contraseña pendiente) o a Solicitudes (rol). */
export async function requireUser(opts: Options = {}): Promise<AdminSessionUser> {
  const user = await currentUser();
  if (!user) redirect("/admin/login");
  if (user.mustChangePassword && !opts.allowPending) redirect("/admin/cuenta?primer-acceso=1");
  if (opts.role && user.role !== opts.role) redirect("/admin/solicitudes");
  return user;
}

/** Atajo para páginas que solo puede ver un rol: `await requireRole("admin")`. */
export const requireRole = (role: AdminRole) => requireUser({ role });

/** Para rutas /api/admin/*: devuelve el usuario o la respuesta de error lista para devolver. */
export async function requireApiUser(
  opts: Options = {},
): Promise<{ user: AdminSessionUser; error?: undefined } | { user?: undefined; error: NextResponse }> {
  const user = await currentUser();
  if (!user) return { error: NextResponse.json({ ok: false, error: "No autorizado" }, { status: 401 }) };
  if (user.mustChangePassword && !opts.allowPending) {
    return { error: NextResponse.json({ ok: false, error: "Debes cambiar la contraseña antes de continuar." }, { status: 403 }) };
  }
  if (opts.role && user.role !== opts.role) {
    return { error: NextResponse.json({ ok: false, error: "No tienes permiso para esta acción." }, { status: 403 }) };
  }
  return { user };
}

/** Atajo para rutas que solo puede usar un rol: `const { error } = await requireApiRole("admin")`. */
export const requireApiRole = (role: AdminRole) => requireApiUser({ role });
