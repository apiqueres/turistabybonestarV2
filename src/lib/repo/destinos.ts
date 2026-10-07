import "server-only";
import { db } from "@/lib/db";
import type { Destination } from "@/types/content";
import type { Destination as Row } from "@/generated/prisma/client";

const toFront = (r: Row): Destination => ({
  id: r.id,
  slug: r.slug,
  name: r.name,
  code: r.code,
  region: r.region,
  lon: r.lon,
  lat: r.lat,
  tagline: r.tagline,
  bestSeason: r.bestSeason,
  duration: r.duration,
  idealFor: r.idealFor,
  ...(r.badge ? { badge: r.badge } : {}),
  includes: r.includes,
  image: { src: r.imageSrc, alt: r.imageAlt },
  featured: r.featured,
});

const toRow = (d: Destination) => ({
  slug: d.slug,
  name: d.name,
  code: d.code,
  region: d.region,
  lon: d.lon,
  lat: d.lat,
  tagline: d.tagline,
  bestSeason: d.bestSeason,
  duration: d.duration,
  idealFor: d.idealFor,
  badge: d.badge || null,
  includes: d.includes,
  imageSrc: d.image.src,
  imageAlt: d.image.alt,
  featured: Boolean(d.featured),
});

/** Destinos activos ordenados (web pública) o todos (admin). */
export async function listDestinations(opts: { all?: boolean } = {}): Promise<Destination[]> {
  const rows = await db().destination.findMany({
    where: opts.all ? undefined : { active: true },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
  });
  return rows.map(toFront);
}

export async function getDestination(id: string): Promise<Destination | null> {
  const row = await db().destination.findUnique({ where: { id } });
  return row ? toFront(row) : null;
}

/** Crea o actualiza; `previousId` permite cambiar el id ISO de una ficha existente. */
export async function upsertDestination(d: Destination, previousId?: string): Promise<Destination> {
  const prisma = db();
  const data = toRow(d);
  if (previousId && previousId !== d.id) {
    const row = await prisma.destination.update({ where: { id: previousId }, data: { id: d.id, ...data } });
    return toFront(row);
  }
  const count = await prisma.destination.count();
  const row = await prisma.destination.upsert({
    where: { id: d.id },
    create: { id: d.id, ...data, sortOrder: count },
    update: data,
  });
  return toFront(row);
}

/** Borra un destino. Falla (P2003) si tiene ofertas asociadas. */
export async function deleteDestination(id: string): Promise<void> {
  await db().destination.delete({ where: { id } });
}

/** Nuevo orden: lista completa de ids en el orden deseado. */
export async function reorderDestinations(ids: string[]): Promise<void> {
  await db().$transaction(ids.map((id, i) => db().destination.update({ where: { id }, data: { sortOrder: i } })));
}
