/**
 * Sembrado inicial: destinos, ofertas, páginas del asistente, bloques de texto y el usuario admin.
 * Importa también las solicitudes/contactos guardados en JSON por la versión anterior (DATA_DIR).
 * Es idempotente: no pisa lo que el admin ya haya editado (solo crea lo que falta).
 *
 *   npm run db:seed            (ADMIN_EMAIL / ADMIN_PASSWORD en .env)
 */
import "dotenv/config";
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import bcrypt from "bcryptjs";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";
import { siteContent } from "../src/data/site";
import { formContent } from "../src/data/form";
import { buildPrompt } from "../src/lib/prompt";
import { contactoSchema, solicitudSchema } from "../src/lib/validation";
import type { Destination, Offer } from "../src/types/content";

const url = process.env.DATABASE_URL;
if (!url) throw new Error("DATABASE_URL no está definida");
const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: url }) });
const DATA_DIR = process.env.DATA_DIR ?? path.join(process.cwd(), "data");

async function seedDestinations() {
  const list = siteContent.destinations as Destination[];
  let created = 0;
  for (const [i, d] of list.entries()) {
    const exists = await prisma.destination.findUnique({ where: { id: d.id } });
    if (exists) continue;
    await prisma.destination.create({
      data: {
        id: d.id, slug: d.slug, name: d.name, code: d.code, region: d.region, lon: d.lon, lat: d.lat,
        tagline: d.tagline, bestSeason: d.bestSeason, duration: d.duration, idealFor: d.idealFor,
        badge: d.badge ?? null, includes: d.includes, imageSrc: d.image.src, imageAlt: d.image.alt,
        featured: Boolean(d.featured), sortOrder: i,
      },
    });
    created++;
  }
  console.log(`[seed] destinos: ${created} creados (${list.length} en total)`);
}

async function seedOffers() {
  const list = siteContent.offersList as Offer[];
  let created = 0;
  for (const [i, o] of list.entries()) {
    const exists = await prisma.offer.findUnique({ where: { id: o.id } });
    if (exists) continue;
    await prisma.offer.create({
      data: {
        id: o.id, title: o.title, destinationId: o.destinationId, price: o.price, priceNote: o.priceNote,
        dates: o.dates, duration: o.duration, text: o.text, includes: o.includes, imageSrc: o.image.src,
        imageAlt: o.image.alt, badge: o.badge ?? null, active: o.active, sortOrder: i,
      },
    });
    created++;
  }
  console.log(`[seed] ofertas: ${created} creadas (${list.length} en total)`);
}

async function seedFormSteps() {
  let created = 0;
  for (const [i, s] of formContent.steps.entries()) {
    const exists = await prisma.formStep.findUnique({ where: { id: s.id } });
    if (exists) continue;
    await prisma.formStep.create({ data: { id: s.id, sortOrder: i, data: s as object } });
    created++;
  }
  console.log(`[seed] páginas del formulario: ${created} creadas (${formContent.steps.length} en total)`);
}

async function seedSettings() {
  const { brand, nav, home, map, contact, offers, footer } = siteContent;
  const blocks: Record<string, unknown> = {
    brand, nav, map, contact, offers, footer,
    "home.hero": home.hero, "home.method": home.method, "home.destinations": home.destinations, "home.about": home.about,
    "home.dimensions": home.dimensions, "home.pain": home.pain, "home.team": home.team, "home.closing": home.closing,
  };
  let created = 0;
  for (const [key, data] of Object.entries(blocks)) {
    const exists = await prisma.siteSetting.findUnique({ where: { key } });
    if (exists) continue;
    await prisma.siteSetting.create({ data: { key, data: data as object } });
    created++;
  }
  console.log(`[seed] bloques de texto: ${created} creados (${Object.keys(blocks).length} en total)`);
}

async function seedAdmin() {
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD;
  const count = await prisma.adminUser.count();
  if (count > 0) {
    console.log(`[seed] admin: ya hay ${count} usuario(s), no se crea ninguno`);
    return;
  }
  if (!email || !password) {
    console.warn("[seed] admin: faltan ADMIN_EMAIL/ADMIN_PASSWORD; no se crea el usuario inicial");
    return;
  }
  if (password.length < 8) throw new Error("[seed] ADMIN_PASSWORD debe tener al menos 8 caracteres");
  await prisma.adminUser.create({ data: { email, name: siteContent.brand.name, passwordHash: await bcrypt.hash(password, 12) } });
  console.log(`[seed] admin: creado ${email} (cambia la contraseña desde el panel)`);
}

/** Importa data/solicitudes/*.json y data/contacto/*.json de la versión sin base de datos. */
async function importLegacy() {
  const read = async (dir: string) => {
    try {
      const files = (await readdir(dir)).filter((f) => f.endsWith(".json"));
      return Promise.all(files.map(async (f) => JSON.parse(await readFile(path.join(dir, f), "utf8")) as { id: string; createdAt: string; data: unknown; prompt?: string }));
    } catch {
      return [];
    }
  };
  let s = 0;
  for (const rec of await read(path.join(DATA_DIR, "solicitudes"))) {
    const parsed = solicitudSchema.safeParse(rec.data);
    if (!parsed.success || !rec.id || !rec.createdAt) continue;
    if (await prisma.solicitud.findUnique({ where: { id: rec.id } })) continue;
    await prisma.solicitud.create({
      data: {
        id: rec.id, createdAt: new Date(rec.createdAt), data: parsed.data as object,
        prompt: rec.prompt ?? buildPrompt(rec.id, rec.createdAt, parsed.data),
        email: parsed.data.contacto.email.toLowerCase(), phone: parsed.data.contacto.telefono, name: parsed.data.contacto.nombre,
      },
    });
    s++;
  }
  let c = 0;
  for (const rec of await read(path.join(DATA_DIR, "contacto"))) {
    const parsed = contactoSchema.safeParse(rec.data);
    if (!parsed.success || !rec.id || !rec.createdAt) continue;
    if (await prisma.contacto.findUnique({ where: { id: rec.id } })) continue;
    await prisma.contacto.create({ data: { id: rec.id, createdAt: new Date(rec.createdAt), data: parsed.data as object, email: parsed.data.email.toLowerCase() } });
    c++;
  }
  if (s || c) console.log(`[seed] importados de ${DATA_DIR}: ${s} solicitudes, ${c} contactos`);
}

async function main() {
  await seedDestinations();
  await seedOffers();
  await seedFormSteps();
  await seedSettings();
  await seedAdmin();
  await importLegacy();
}

main()
  .catch((err) => {
    console.error("[seed] error", err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
