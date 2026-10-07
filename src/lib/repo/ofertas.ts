import "server-only";
import { db } from "@/lib/db";
import type { Offer } from "@/types/content";
import type { Offer as Row } from "@/generated/prisma/client";

const toFront = (r: Row): Offer => ({
  id: r.id,
  title: r.title,
  destinationId: r.destinationId,
  price: r.price,
  priceNote: r.priceNote,
  dates: r.dates,
  duration: r.duration,
  text: r.text,
  includes: r.includes,
  image: { src: r.imageSrc, alt: r.imageAlt },
  ...(r.badge ? { badge: r.badge } : {}),
  active: r.active,
});

const toRow = (o: Offer) => ({
  title: o.title,
  destinationId: o.destinationId,
  price: o.price,
  priceNote: o.priceNote,
  dates: o.dates,
  duration: o.duration,
  text: o.text,
  includes: o.includes,
  imageSrc: o.image.src,
  imageAlt: o.image.alt,
  badge: o.badge || null,
  active: o.active,
});

/** Ofertas activas (web) o todas (admin), por orden manual. */
export async function listOffers(opts: { all?: boolean } = {}): Promise<Offer[]> {
  const rows = await db().offer.findMany({
    where: opts.all ? undefined : { active: true },
    orderBy: [{ sortOrder: "asc" }, { updatedAt: "desc" }],
  });
  return rows.map(toFront);
}

export async function upsertOffer(o: Offer): Promise<Offer> {
  const prisma = db();
  const data = toRow(o);
  const existing = await prisma.offer.findUnique({ where: { id: o.id }, select: { id: true } });
  if (existing) return toFront(await prisma.offer.update({ where: { id: o.id }, data }));
  // Las nuevas van primero: desplaza el resto una posición.
  await prisma.offer.updateMany({ data: { sortOrder: { increment: 1 } } });
  return toFront(await prisma.offer.create({ data: { id: o.id, ...data, sortOrder: 0 } }));
}

export async function deleteOffer(id: string): Promise<void> {
  await db().offer.delete({ where: { id } });
}

export async function reorderOffers(ids: string[]): Promise<void> {
  await db().$transaction(ids.map((id, i) => db().offer.update({ where: { id }, data: { sortOrder: i } })));
}
