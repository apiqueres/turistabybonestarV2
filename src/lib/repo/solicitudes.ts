import "server-only";
import { randomUUID } from "node:crypto";
import { db } from "@/lib/db";
import { buildPrompt } from "@/lib/prompt";
import type { SolicitudInput } from "@/lib/validation";
import type { MessageEntry, Page, RequestStatus, StoredRequest } from "@/types/admin";
import type { RequestStatus as DbStatus, MessageLog, Solicitud } from "@/generated/prisma/client";

/** El admin usa "en-curso"; la BD, `en_curso`. */
export const toDbStatus = (s: RequestStatus): DbStatus => (s === "en-curso" ? "en_curso" : s);
export const fromDbStatus = (s: DbStatus): RequestStatus => (s === "en_curso" ? "en-curso" : s);

/** Mismo formato de id que los ficheros JSON antiguos: <iso-fecha>_<8 hex>. */
export const newRecordId = (now: Date) => `${now.toISOString().replace(/[:.]/g, "-")}_${randomUUID().slice(0, 8)}`;

const toEntry = (m: MessageLog): MessageEntry => ({
  id: m.id,
  createdAt: m.createdAt.toISOString(),
  to: m.to,
  subject: m.subject,
  kind: m.kind,
  status: m.status,
  error: m.error,
});

const toFront = (r: Solicitud & { messages?: MessageLog[] }): StoredRequest => ({
  id: r.id,
  createdAt: r.createdAt.toISOString(),
  data: r.data as unknown as SolicitudInput,
  status: fromDbStatus(r.status),
  ...(r.notes ? { notes: r.notes } : {}),
  prompt: r.prompt,
  ...(r.messages ? { messages: r.messages.map(toEntry) } : {}),
});

/** Inserta una solicitud validada y su brief. Devuelve lo que ya devolvía la API. */
export async function createSolicitud(data: SolicitudInput): Promise<{ id: string; createdAt: string; prompt: string }> {
  const now = new Date();
  const id = newRecordId(now);
  const createdAt = now.toISOString();
  const prompt = buildPrompt(id, createdAt, data);
  await db().solicitud.create({
    data: {
      id,
      createdAt: now,
      data: data as object,
      prompt,
      email: data.contacto.email.toLowerCase(),
      phone: data.contacto.telefono,
      name: data.contacto.nombre,
    },
  });
  return { id, createdAt, prompt };
}

export interface ListOptions {
  page?: number;
  pageSize?: number;
  status?: RequestStatus | "todas";
  q?: string;
}

/** Listado paginado (10 por página) con filtro por estado y texto (nombre, correo, teléfono, destino). */
export async function listSolicitudes(opts: ListOptions = {}): Promise<Page<StoredRequest> & { counts: Record<RequestStatus | "todas", number> }> {
  const prisma = db();
  const pageSize = opts.pageSize ?? 10;
  const q = opts.q?.trim();
  const where = {
    ...(opts.status && opts.status !== "todas" ? { status: toDbStatus(opts.status) } : {}),
    ...(q
      ? {
          OR: [
            { name: { contains: q, mode: "insensitive" as const } },
            { email: { contains: q, mode: "insensitive" as const } },
            { phone: { contains: q } },
            { id: { contains: q } },
            { prompt: { contains: q, mode: "insensitive" as const } },
          ],
        }
      : {}),
  };
  const [total, grouped] = await Promise.all([
    prisma.solicitud.count({ where }),
    prisma.solicitud.groupBy({ by: ["status"], _count: { _all: true } }),
  ]);
  const pages = Math.max(1, Math.ceil(total / pageSize));
  const page = Math.min(Math.max(1, opts.page ?? 1), pages);
  const rows = await prisma.solicitud.findMany({ where, orderBy: { createdAt: "desc" }, skip: (page - 1) * pageSize, take: pageSize });
  const counts: Record<RequestStatus | "todas", number> = { todas: 0, nueva: 0, "en-curso": 0, cerrada: 0 };
  for (const g of grouped) {
    counts[fromDbStatus(g.status)] = g._count._all;
    counts.todas += g._count._all;
  }
  return { rows: rows.map(toFront), total, page, pageSize, counts };
}

export async function getSolicitud(id: string): Promise<StoredRequest | null> {
  const row = await db().solicitud.findUnique({ where: { id }, include: { messages: { orderBy: { createdAt: "desc" } } } });
  return row ? toFront(row) : null;
}

export async function updateSolicitud(id: string, patch: { status?: RequestStatus; notes?: string }): Promise<StoredRequest> {
  const row = await db().solicitud.update({
    where: { id },
    data: {
      ...(patch.status ? { status: toDbStatus(patch.status) } : {}),
      ...(patch.notes !== undefined ? { notes: patch.notes || null } : {}),
    },
    include: { messages: { orderBy: { createdAt: "desc" } } },
  });
  return toFront(row);
}

/** Borrado real (derechos RGPD). Los MessageLog se borran en cascada. */
export async function deleteSolicitud(id: string): Promise<void> {
  await db().solicitud.delete({ where: { id } });
}

/** Deja constancia de un correo enviado (o fallido) desde el servidor. */
export async function logMessage(entry: { solicitudId?: string; to: string; subject: string; kind: string; status: string; error?: string }): Promise<void> {
  await db().messageLog.create({ data: { ...entry, error: entry.error ?? null } });
}

/** Anonimiza las solicitudes cerradas con más de `months` meses (tarea opcional de mantenimiento). */
export async function anonymiseClosed(months = 24): Promise<number> {
  const prisma = db();
  const before = new Date();
  before.setMonth(before.getMonth() - months);
  const rows = await prisma.solicitud.findMany({ where: { status: "cerrada", createdAt: { lt: before }, NOT: { email: "" } } });
  for (const r of rows) {
    const data = r.data as unknown as SolicitudInput;
    const anon: SolicitudInput = { ...data, contacto: { ...data.contacto, nombre: "Anonimizado", email: "", telefono: "" } };
    await prisma.solicitud.update({
      where: { id: r.id },
      data: { data: anon as object, email: "", phone: "", name: "Anonimizado", prompt: buildPrompt(r.id, r.createdAt.toISOString(), anon) },
    });
  }
  return rows.length;
}
