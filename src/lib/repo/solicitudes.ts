import "server-only";
import { randomUUID } from "node:crypto";
import { db } from "@/lib/db";
import { buildPrompt } from "@/lib/prompt";
import type { SolicitudInput } from "@/lib/validation";
import type { MessageEntry, Page, RequestStatus, StoredRequest } from "@/types/admin";
import type { AdminRole, RequestStatus as DbStatus, MessageLog, Solicitud } from "@/generated/prisma/client";

/** Quién hace la consulta. Un gestor solo ve y toca las solicitudes asignadas a él. */
export interface Actor {
  id: string;
  role: AdminRole;
}

/** El admin usa "en-curso"; la BD, `en_curso`. */
export const toDbStatus = (s: RequestStatus): DbStatus => (s === "en-curso" ? "en_curso" : s);
export const fromDbStatus = (s: DbStatus): RequestStatus => (s === "en_curso" ? "en-curso" : s);

/** Mismo formato de id que los ficheros JSON antiguos: <iso-fecha>_<8 hex>. */
export const newRecordId = (now: Date) => `${now.toISOString().replace(/[:.]/g, "-")}_${randomUUID().slice(0, 8)}`;

/** Filtro de acceso: el gestor solo ve las suyas. Se aplica en todas las lecturas y escrituras de este módulo. */
const scopeFor = (actor: Actor) => (actor.role === "gestor" ? { assignedToId: actor.id } : {});

const ASSIGNEE = { assignedTo: { select: { id: true, name: true } } } as const;

type Row = Solicitud & { assignedTo?: { id: string; name: string } | null; messages?: MessageLog[] };

const toEntry = (m: MessageLog): MessageEntry => ({
  id: m.id,
  createdAt: m.createdAt.toISOString(),
  to: m.to,
  from: m.from,
  subject: m.subject,
  kind: m.kind,
  status: m.status,
  error: m.error,
});

const toFront = (r: Row): StoredRequest => ({
  id: r.id,
  createdAt: r.createdAt.toISOString(),
  data: r.data as unknown as SolicitudInput,
  status: fromDbStatus(r.status),
  ...(r.notes ? { notes: r.notes } : {}),
  prompt: r.prompt,
  assignedTo: r.assignedTo ? { id: r.assignedTo.id, name: r.assignedTo.name } : null,
  assignedAt: r.assignedAt?.toISOString() ?? null,
  ...(r.messages ? { messages: r.messages.map(toEntry) } : {}),
});

/** Inserta una solicitud validada y su brief. Sin asignar: solo la ve el admin hasta que la asigna. */
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
  /** Solo admin: "todas", "sin" (sin asignar) o el id de un gestor. Un gestor siempre ve solo las suyas. */
  gestor?: string;
  q?: string;
}

/** Listado paginado (10 por página) con filtros por estado, gestor y texto (nombre, correo, teléfono, id, brief, nombre del gestor). */
export async function listSolicitudes(
  actor: Actor,
  opts: ListOptions = {},
): Promise<Page<StoredRequest> & { counts: Record<RequestStatus | "todas", number> }> {
  const prisma = db();
  const pageSize = opts.pageSize ?? 10;
  const q = opts.q?.trim();
  const gestorFilter =
    actor.role === "admin" && opts.gestor && opts.gestor !== "todas"
      ? opts.gestor === "sin"
        ? { assignedToId: null }
        : { assignedToId: opts.gestor }
      : {};
  const base = { ...scopeFor(actor), ...gestorFilter };
  const where = {
    ...base,
    ...(opts.status && opts.status !== "todas" ? { status: toDbStatus(opts.status) } : {}),
    ...(q
      ? {
          OR: [
            { name: { contains: q, mode: "insensitive" as const } },
            { email: { contains: q, mode: "insensitive" as const } },
            { phone: { contains: q } },
            { id: { contains: q } },
            { prompt: { contains: q, mode: "insensitive" as const } },
            { assignedTo: { is: { name: { contains: q, mode: "insensitive" as const } } } },
          ],
        }
      : {}),
  };
  const [total, grouped] = await Promise.all([
    prisma.solicitud.count({ where }),
    prisma.solicitud.groupBy({ by: ["status"], where: base, _count: { _all: true } }),
  ]);
  const pages = Math.max(1, Math.ceil(total / pageSize));
  const page = Math.min(Math.max(1, opts.page ?? 1), pages);
  const rows = await prisma.solicitud.findMany({
    where,
    include: ASSIGNEE,
    orderBy: { createdAt: "desc" },
    skip: (page - 1) * pageSize,
    take: pageSize,
  });
  const counts: Record<RequestStatus | "todas", number> = { todas: 0, nueva: 0, "en-curso": 0, cerrada: 0 };
  for (const g of grouped) {
    counts[fromDbStatus(g.status)] = g._count._all;
    counts.todas += g._count._all;
  }
  return { rows: rows.map(toFront), total, page, pageSize, counts };
}

/** Una solicitud con sus correos. null si no existe o no es visible para este usuario. */
export async function getSolicitud(id: string, actor: Actor): Promise<StoredRequest | null> {
  const row = await db().solicitud.findFirst({
    where: { id, ...scopeFor(actor) },
    include: { ...ASSIGNEE, messages: { orderBy: { createdAt: "desc" } } },
  });
  return row ? toFront(row) : null;
}

/** Cambia el estado y/o las notas. null si no es visible para este usuario. */
export async function updateSolicitud(
  id: string,
  patch: { status?: RequestStatus; notes?: string },
  actor: Actor,
): Promise<StoredRequest | null> {
  const visible = await db().solicitud.findFirst({ where: { id, ...scopeFor(actor) }, select: { id: true } });
  if (!visible) return null;
  const row = await db().solicitud.update({
    where: { id },
    data: {
      ...(patch.status ? { status: toDbStatus(patch.status) } : {}),
      ...(patch.notes !== undefined ? { notes: patch.notes || null } : {}),
    },
    include: { ...ASSIGNEE, messages: { orderBy: { createdAt: "desc" } } },
  });
  return toFront(row);
}

/** Asigna (o desasigna con null) la solicitud a un gestor. Solo lo llama la ruta de admin. */
export async function assignSolicitud(id: string, gestorId: string | null): Promise<StoredRequest> {
  const row = await db().solicitud.update({
    where: { id },
    data: { assignedToId: gestorId, assignedAt: gestorId ? new Date() : null },
    include: { ...ASSIGNEE, messages: { orderBy: { createdAt: "desc" } } },
  });
  return toFront(row);
}

/** Borrado real (derechos RGPD). Los MessageLog se borran en cascada. Solo lo llama la ruta de admin. */
export async function deleteSolicitud(id: string): Promise<void> {
  await db().solicitud.delete({ where: { id } });
}

/** Deja constancia de un correo enviado (o fallido) desde el servidor. */
export async function logMessage(entry: {
  solicitudId?: string;
  to: string;
  from: string;
  sentById?: string;
  subject: string;
  kind: string;
  status: string;
  error?: string;
}): Promise<void> {
  await db().messageLog.create({
    data: {
      solicitudId: entry.solicitudId ?? null,
      to: entry.to,
      from: entry.from,
      sentById: entry.sentById ?? null,
      subject: entry.subject,
      kind: entry.kind,
      status: entry.status,
      error: entry.error ?? null,
    },
  });
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
