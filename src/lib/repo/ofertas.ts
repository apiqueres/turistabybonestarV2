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
  promo: r.promo,
  ...(r.promoText ? { promoText: r.promoText } : {}),
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
  promo: o.promo,
  promoText: o.promoText || null,
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
  const data = toRow(o);
  return db().$transaction(async (tx) => {
    // Solo una promoción de portada: marcar esta desmarca las demás.
    if (o.promo) await tx.offer.updateMany({ where: { id: { not: o.id }, promo: true }, data: { promo: false } });
    const existing = await tx.offer.findUnique({ where: { id: o.id }, select: { id: true } });
    if (existing) return toFront(await tx.offer.update({ where: { id: o.id }, data }));
    // Las nuevas van primero: desplaza el resto una posición.
    await tx.offer.updateMany({ data: { sortOrder: { increment: 1 } } });
    return toFront(await tx.offer.create({ data: { id: o.id, ...data, sortOrder: 0 } }));
  });
}

/** La oferta marcada como promoción de portada, si está activa. */
export async function getPromoOffer(): Promise<Offer | null> {
  const row = await db().offer.findFirst({ where: { promo: true, active: true }, orderBy: { updatedAt: "desc" } });
  return row ? toFront(row) : null;
}

export async function deleteOffer(id: string): Promise<void> {
  await db().offer.delete({ where: { id } });
}

export async function reorderOffers(ids: string[]): Promise<void> {
  await db().$transaction(ids.map((id, i) => db().offer.update({ where: { id }, data: { sortOrder: i } })));
}
