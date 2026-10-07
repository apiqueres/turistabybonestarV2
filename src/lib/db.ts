import "server-only";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";

/**
 * Cliente Prisma (singleton). Se crea en el primer uso para que importar este módulo
 * en un build sin base de datos (demo de GitHub Pages, imagen Docker) no abra conexiones.
 */
const g = globalThis as unknown as { __tbbPrisma?: PrismaClient };

/** true cuando hay DATABASE_URL (VPS/desarrollo); false en la demo estática. */
export const hasDatabase = () => Boolean(process.env.DATABASE_URL);

export function db(): PrismaClient {
  if (!g.__tbbPrisma) {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) throw new Error("[db] DATABASE_URL no está definida");
    g.__tbbPrisma = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });
  }
  return g.__tbbPrisma;
}
