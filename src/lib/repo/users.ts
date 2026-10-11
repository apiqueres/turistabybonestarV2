import "server-only";
import { randomBytes } from "node:crypto";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { decryptSecret, encryptSecret } from "@/lib/secret-box";
import type { AdminRole } from "@/generated/prisma/client";

export const BCRYPT_COST = 12;

export interface AdminAccount {
  id: string;
  email: string;
  name: string;
  role: AdminRole;
  active: boolean;
  mustChangePassword: boolean;
}

const toAccount = (u: { id: string; email: string; name: string; role: AdminRole; active: boolean; mustChangePassword: boolean }): AdminAccount => ({
  id: u.id,
  email: u.email,
  name: u.name,
  role: u.role,
  active: u.active,
  mustChangePassword: u.mustChangePassword,
});

/** Comprueba correo y contraseña; devuelve la cuenta o null (también si está desactivada). Nunca registra la contraseña. */
export async function verifyCredentials(email: string, password: string): Promise<AdminAccount | null> {
  const user = await db().adminUser.findUnique({ where: { email: email.trim().toLowerCase() } });
  if (!user) {
    // Coste constante aunque el usuario no exista.
    await bcrypt.compare(password, "$2a$12$CwTycUXWue0Thq9StjUM0uJ8Y2m8Y0bq0bq0bq0bq0bq0bq0bq0bq");
    return null;
  }
  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok || !user.active) return null;
  await db().adminUser.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });
  return toAccount(user);
}

/** Cuenta actual desde la base de datos (rol, activa y cambio pendiente siempre al día). */
export async function getAccount(id: string): Promise<AdminAccount | null> {
  const u = await db().adminUser.findUnique({ where: { id } });
  return u ? toAccount(u) : null;
}

/** Cambia la contraseña comprobando la actual y quita la obligación de cambiarla. */
export async function changePassword(id: string, current: string, next: string): Promise<"ok" | "wrong-password"> {
  const user = await db().adminUser.findUnique({ where: { id } });
  if (!user || !(await bcrypt.compare(current, user.passwordHash))) return "wrong-password";
  await db().adminUser.update({ where: { id }, data: { passwordHash: await bcrypt.hash(next, BCRYPT_COST), mustChangePassword: false } });
  return "ok";
}

/** Lista de usuarios para la sección Usuarios (sin contraseñas ni claves de Gmail). */
export async function listUsers() {
  const rows = await db().adminUser.findMany({ orderBy: [{ role: "asc" }, { name: "asc" }] });
  return rows.map((u) => ({
    ...toAccount(u),
    lastLoginAt: u.lastLoginAt?.toISOString() ?? null,
    gmailUser: u.gmailUser,
    gmailConnected: Boolean(u.gmailAppPass),
  }));
}

/** Cuentas activas a las que se puede asignar una solicitud (id y nombre). */
export async function listAssignees(): Promise<{ id: string; name: string }[]> {
  return db().adminUser.findMany({ where: { active: true }, select: { id: true, name: true }, orderBy: { name: "asc" } });
}

/** Activa o desactiva una cuenta. Nadie puede desactivarse a sí mismo. */
export async function setUserActive(targetId: string, active: boolean, actorId: string): Promise<"ok" | "self"> {
  if (!active && targetId === actorId) return "self";
  await db().adminUser.update({ where: { id: targetId }, data: { active } });
  return "ok";
}

/**
 * Restablece la contraseña con una temporal aleatoria que se muestra una sola vez.
 * El usuario tendrá que cambiarla en su primer acceso.
 */
export async function resetPassword(targetId: string): Promise<string> {
  const temporal = randomBytes(9).toString("base64url");
  await db().adminUser.update({
    where: { id: targetId },
    data: { passwordHash: await bcrypt.hash(temporal, BCRYPT_COST), mustChangePassword: true },
  });
  return temporal;
}

/* ---- Correo por Gmail de cada usuario ----------------------------------------------------- */

/** Estado del correo del usuario para «Mi cuenta». Nunca devuelve la contraseña de aplicación. */
export async function getMailSettings(id: string) {
  const u = await db().adminUser.findUnique({ where: { id }, select: { gmailUser: true, gmailAppPass: true, bccSelf: true } });
  return {
    gmailUser: u?.gmailUser ?? null,
    gmailConnected: Boolean(u?.gmailAppPass),
    bccSelf: u?.bccSelf ?? false,
  };
}

/** Credenciales de Gmail del usuario para enviar, o null si no ha conectado su cuenta. Solo uso interno del servidor. */
export async function getGmailCredentials(id: string): Promise<{ user: string; pass: string; bccSelf: boolean } | null> {
  const u = await db().adminUser.findUnique({ where: { id }, select: { gmailUser: true, gmailAppPass: true, bccSelf: true } });
  if (!u?.gmailUser || !u.gmailAppPass) return null;
  return { user: u.gmailUser, pass: decryptSecret(u.gmailAppPass), bccSelf: u.bccSelf };
}

/** Guarda la cuenta de Gmail y su contraseña de aplicación (cifrada). */
export async function saveGmail(id: string, gmailUser: string, appPassword: string) {
  await db().adminUser.update({
    where: { id },
    data: { gmailUser: gmailUser.trim().toLowerCase(), gmailAppPass: encryptSecret(appPassword.replace(/\s+/g, "")) },
  });
}

export async function clearGmail(id: string) {
  await db().adminUser.update({ where: { id }, data: { gmailUser: null, gmailAppPass: null, bccSelf: false } });
}

export async function setBccSelf(id: string, bccSelf: boolean) {
  await db().adminUser.update({ where: { id }, data: { bccSelf } });
}
