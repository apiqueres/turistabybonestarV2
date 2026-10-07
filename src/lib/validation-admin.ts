import { z } from "zod";

/** Esquemas de las operaciones del admin (rutas /api/admin/*). Compartidos con los formularios. */

const s = z.string().max(4000);
const short = z.string().trim().max(200);
const pair = z.tuple([s, s]);
const link = z.object({ label: s, href: s });
const media = z.object({ src: z.string().max(2_000_000), alt: s });
const stat = z.object({ value: z.number().finite(), suffix: s.optional(), label: s });

export const passwordChangeSchema = z
  .object({
    current: z.string().min(1, "Escribe tu contraseña actual").max(200),
    next: z.string().min(10, "Mínimo 10 caracteres").max(200),
    confirm: z.string().max(200),
  })
  .refine((v) => v.next === v.confirm, { path: ["confirm"], message: "Las contraseñas no coinciden" });
export type PasswordChangeInput = z.infer<typeof passwordChangeSchema>;

export const requestStatusSchema = z.enum(["nueva", "en-curso", "cerrada"]);
export const requestPatchSchema = z.object({ status: requestStatusSchema.optional(), notes: z.string().max(20_000).optional() });
export const adminMessageSchema = z.object({
  subject: z.string().trim().min(1, "Falta el asunto").max(200),
  message: z.string().trim().min(1, "Escribe el mensaje").max(20_000),
  signature: z.string().max(1000),
  includeSummary: z.boolean(),
});

export const destinationSchema = z.object({
  id: z.string().trim().min(1, "Falta el id").max(12),
  slug: z.string().trim().min(1, "Falta el slug").max(80).regex(/^[a-z0-9-]+$/, "El slug solo admite minúsculas, números y guiones"),
  name: short.min(1, "Falta el nombre"),
  code: short,
  region: short,
  lon: z.number().finite().min(-180).max(180),
  lat: z.number().finite().min(-90).max(90),
  tagline: s,
  bestSeason: short,
  duration: short,
  idealFor: short,
  badge: short.optional(),
  includes: z.array(s).max(20),
  image: media,
  featured: z.boolean().optional(),
});
export const destinationUpsertSchema = z.object({ destination: destinationSchema, previousId: z.string().max(12).optional() });

export const offerSchema = z.object({
  id: z.string().trim().min(1).max(120).regex(/^[a-z0-9-]+$/, "El id solo admite minúsculas, números y guiones"),
  title: short.min(1, "Falta el título"),
  destinationId: z.string().trim().min(1, "Falta el destino").max(80),
  price: short.min(1, "Falta el precio"),
  priceNote: short,
  dates: short,
  duration: short,
  text: s,
  includes: z.array(s).max(20),
  image: media,
  badge: short.optional(),
  active: z.boolean(),
});

export const reorderSchema = z.object({ ids: z.array(z.string().max(120)).max(500) });

const option = z.object({ id: short.min(1), label: s, text: s.optional() });
const question = z.discriminatedUnion("kind", [
  z.object({ id: short.min(1), kind: z.literal("multi"), label: s.optional(), max: z.number().int().positive().optional(), layout: z.enum(["cards", "chips"]), options: z.array(option).max(60) }),
  z.object({ id: short.min(1), kind: z.literal("single"), label: s.optional(), layout: z.enum(["cards", "chips"]), options: z.array(option).max(60) }),
  z.object({ id: short.min(1), kind: z.literal("text"), label: s, placeholder: s.optional(), multiline: z.boolean().optional(), inputType: z.enum(["text", "email", "tel"]).optional(), required: z.boolean().optional() }),
  z.object({ id: short.min(1), kind: z.literal("date"), label: s }),
  z.object({ id: short.min(1), kind: z.literal("number"), label: s, min: z.number(), max: z.number() }),
  z.object({ id: short.min(1), kind: z.literal("toggle"), label: s, required: z.boolean().optional() }),
  z.object({ id: short.min(1), kind: z.literal("destinations") }),
]);
export const formStepSchema = z.object({ id: short.min(1), kicker: s, title: pair, text: s, hint: s.optional(), questions: z.array(question).max(40) });
export const formStepsSchema = z.array(formStepSchema).min(1).max(10);

/** Un esquema por bloque de SiteSetting, con la misma forma que src/data/site.ts. */
export const settingSchemas = {
  brand: z.object({ name: s, tagline: s, city: s, phone: s, whatsapp: s, communityName: s, communityUrl: s, email: s, hours: s, instagram: s, year: z.number().int() }),
  nav: z.object({ links: z.array(link.extend({ key: s, accent: z.boolean().optional() })).max(12), cta: link }),
  "home.hero": z.object({ kicker: s, word: s, subtitle: pair, primary: link, secondary: link, video: z.object({ mp4: s, poster: s }) }),
  "home.method": z.object({ kicker: s, steps: z.array(z.object({ number: s, title: pair, text: s })).max(10) }),
  "home.destinations": z.object({ kicker: s, title: pair, link }),
  "home.about": z.object({ kicker: s, title: z.array(s).max(6), meta: s, image: media, paragraph: s, stats: z.tuple([stat, stat]), partners: z.array(s).max(20) }),
  "home.dimensions": z.object({ kicker: s, text: s, items: z.array(z.object({ label: s, step: z.number().int() })).max(20) }),
  "home.pain": z.object({ kicker: s, statement: pair, items: z.array(s).max(12), answer: s, quote: s, author: s, meta: s }),
  "home.team": z.object({ title: s, members: z.array(z.object({ id: s, name: s, role: s, bio: s, stats: z.tuple([stat, stat]), image: media })).max(12) }),
  "home.closing": z.object({ kicker: s, title: pair, image: media, primary: link, secondary: link }),
  map: z.object({
    kicker: s, title: s, text: s,
    rule: z.object({ label: s, hint: pair }),
    search: z.object({ placeholder: s, hint: s }),
    legend: pair,
    list: z.object({ label: s, empty: s, cta: s, ctaHref: s, needOne: s }),
    recurrent: z.object({ kicker: s, title: pair, text: s }),
    add: s, remove: s,
  }),
  contact: z.object({
    kicker: s, title: s, text: s, formKicker: s,
    fields: z.object({ name: s, email: s, phone: s, message: s, messagePlaceholder: s, privacy: s, submit: s }),
    success: z.object({ title: s, text: s }),
    mapNudge: z.object({ text: s, cta: link }),
  }),
  offers: z.object({ kicker: s, title: pair, text: s, community: z.object({ kicker: s, title: s, text: s, cta: s }), empty: s, cta: s }),
  footer: z.object({ sections: s, contact: s, legal: s, legalLinks: z.array(link).max(10), credits: link }),
} as const;
export type SettingKey = keyof typeof settingSchemas;
export const SETTING_LABELS: Record<SettingKey, string> = {
  brand: "Marca y contacto (teléfono, WhatsApp, comunidad, correo, horario)",
  nav: "Menú de navegación",
  "home.hero": "Inicio · Portada",
  "home.method": "Inicio · El método en 3 pasos",
  "home.destinations": "Inicio · Cabecera de destinos",
  "home.about": "Inicio · A quién nos dirigimos",
  "home.dimensions": "Inicio · Lo que te preguntamos",
  "home.pain": "Inicio · El dolor real y el testimonio",
  "home.team": "Inicio · Equipo",
  "home.closing": "Inicio · Cierre",
  map: "Mapa «¿Dónde nos vamos?»",
  contact: "Página de contacto",
  offers: "Página de ofertas y comunidad",
  footer: "Pie de página",
};
