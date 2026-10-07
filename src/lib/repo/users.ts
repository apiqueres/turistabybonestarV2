import "server-only";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";

export const BCRYPT_COST = 12;

export interface AdminAccount {
  id: string;
  email: string;
  name: string;
}

/** Comprueba correo y contraseña; devuelve la cuenta o null. Nunca registra la contraseña. */
export async function verifyCredentials(email: string, password: string): Promise<AdminAccount | null> {
  const user = await db().adminUser.findUnique({ where: { email: email.trim().toLowerCase() } });
  if (!user) {
    // Coste constante aunque el usuario no exista.
    await bcrypt.compare(password, "$2a$12$CwTycUXWue0Thq9StjUM0uJ8Y2m8Y0bq0bq0bq0bq0bq0bq0bq0bq");
    return null;
  }
  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) return null;
  await db().adminUser.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });
  return { id: user.id, email: user.email, name: user.name };
}

export async function getAccount(id: string): Promise<AdminAccount | null> {
  const u = await db().adminUser.findUnique({ where: { id } });
  return u ? { id: u.id, email: u.email, name: u.name } : null;
}

/** Cambia la contraseña comprobando la actual. */
export async function changePassword(id: string, current: string, next: string): Promise<"ok" | "wrong-password"> {
  const user = await db().adminUser.findUnique({ where: { id } });
  if (!user || !(await bcrypt.compare(current, user.passwordHash))) return "wrong-password";
  await db().adminUser.update({ where: { id }, data: { passwordHash: await bcrypt.hash(next, BCRYPT_COST) } });
  return "ok";
}
