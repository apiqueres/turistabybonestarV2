import "server-only";
import { db } from "@/lib/db";
import type { ContactoInput } from "@/lib/validation";
import type { Page, StoredContact } from "@/types/admin";
import type { Contacto } from "@/generated/prisma/client";
import { newRecordId } from "./solicitudes";

const toFront = (r: Contacto): StoredContact => ({
  id: r.id,
  createdAt: r.createdAt.toISOString(),
  data: r.data as unknown as ContactoInput,
  handled: r.handled,
});

export async function createContacto(data: ContactoInput): Promise<{ id: string; createdAt: string }> {
  const now = new Date();
  const id = newRecordId(now);
  await db().contacto.create({ data: { id, createdAt: now, data: data as object, email: data.email.toLowerCase() } });
  return { id, createdAt: now.toISOString() };
}

export async function listContactos(opts: { page?: number; pageSize?: number; pending?: boolean } = {}): Promise<Page<StoredContact> & { pending: number }> {
  const prisma = db();
  const pageSize = opts.pageSize ?? 10;
  const where = opts.pending ? { handled: false } : undefined;
  const [total, pending] = await Promise.all([prisma.contacto.count({ where }), prisma.contacto.count({ where: { handled: false } })]);
  const pages = Math.max(1, Math.ceil(total / pageSize));
  const page = Math.min(Math.max(1, opts.page ?? 1), pages);
  const rows = await prisma.contacto.findMany({ where, orderBy: { createdAt: "desc" }, skip: (page - 1) * pageSize, take: pageSize });
  return { rows: rows.map(toFront), total, page, pageSize, pending };
}

export async function setContactoHandled(id: string, handled: boolean): Promise<StoredContact> {
  return toFront(await db().contacto.update({ where: { id }, data: { handled } }));
}

export async function deleteContacto(id: string): Promise<void> {
  await db().contacto.delete({ where: { id } });
}
