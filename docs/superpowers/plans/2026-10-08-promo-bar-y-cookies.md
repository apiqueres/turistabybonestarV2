# Barra de promoción y banner de cookies — plan de implementación

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Una oferta marcada en el admin aparece como barra dorada bajo la cabecera en la portada, con cierre, y un banner de cookies sale en todas las rutas.

**Architecture:** Dos columnas nuevas en `Offer` (Prisma) con exclusividad garantizada en `upsertOffer`; la oferta promocionada viaja en `SiteContent.promo` y la pinta un componente cliente `PromoBar` montado en `SiteShell`. El banner de cookies es un componente cliente independiente montado en el layout raíz; ambos persisten el cierre en `localStorage`.

**Tech Stack:** Next.js (App Router, TypeScript), Prisma + PostgreSQL 16, zod, CSS propio en `globals.css`, docker compose.

## Global Constraints

- Spec: `docs/superpowers/specs/2026-10-08-promo-bar-y-cookies-design.md`.
- No hay tests automáticos: cada tarea se verifica con `npm run lint`, `npx tsc --noEmit` y, al final, con la app desplegada.
- Textos de la interfaz en castellano. Claves de `localStorage` con prefijo `tb:`.
- Colores y clases existentes: `--gold`, `--ink`, `--paper`, `--line`, `--nav-h`, `.btn .btn-primary .btn-sm`, `.btn-secondary`, `.badge`.
- No commitear ficheros con cambios previos ajenos sin avisar: el árbol ya tiene 32 ficheros modificados sin commit.

---

### Task 1: Modelo y validación

**Files:**
- Modify: `prisma/schema.prisma` (model Offer)
- Create: `prisma/migrations/20261008140000_add_offer_promo/migration.sql`
- Modify: `src/types/content.ts` (interface Offer, interface SiteContent)
- Modify: `src/lib/validation-admin.ts` (offerSchema)
- Modify: `src/lib/repo/ofertas.ts`
- Modify: `src/data/ofertas.json`, `src/data/site.ts`, `src/components/admin/OfferEditor.tsx` (EMPTY_OFFER)

**Interfaces:**
- Produces: `Offer.promo: boolean`, `Offer.promoText?: string`, `SiteContent.promo: Offer | null`, `getPromoOffer(): Promise<Offer | null>`.

- [ ] **Step 1: Prisma.** En `model Offer` añadir tras `badge`:
```prisma
  promo         Boolean     @default(false)
  promoText     String?
```
- [ ] **Step 2: Migración** (`migration.sql`):
```sql
ALTER TABLE "Offer" ADD COLUMN "promo" BOOLEAN NOT NULL DEFAULT false,
                    ADD COLUMN "promoText" TEXT;
```
- [ ] **Step 3: `npm run db:generate`** (regenera `src/generated/prisma`). Expected: sin errores.
- [ ] **Step 4: Tipos.** En `Offer`: `promo: boolean; /** Texto de la barra de portada; vacío = "Título · desde Precio". */ promoText?: string;`. En `SiteContent`: `/** Oferta activa marcada como promoción de portada. */ promo: Offer | null;`.
- [ ] **Step 5: zod.** En `offerSchema`: `promo: z.boolean().default(false), promoText: short.optional(),`.
- [ ] **Step 6: Repo.** `toFront`: `promo: r.promo, ...(r.promoText ? { promoText: r.promoText } : {})`. `toRow`: `promo: o.promo, promoText: o.promoText || null`. `upsertOffer` en transacción:
```ts
export async function upsertOffer(o: Offer): Promise<Offer> {
  const prisma = db();
  const data = toRow(o);
  return prisma.$transaction(async (tx) => {
    if (o.promo) await tx.offer.updateMany({ where: { id: { not: o.id }, promo: true }, data: { promo: false } });
    const existing = await tx.offer.findUnique({ where: { id: o.id }, select: { id: true } });
    if (existing) return toFront(await tx.offer.update({ where: { id: o.id }, data }));
    await tx.offer.updateMany({ data: { sortOrder: { increment: 1 } } });
    return toFront(await tx.offer.create({ data: { id: o.id, ...data, sortOrder: 0 } }));
  });
}
export async function getPromoOffer(): Promise<Offer | null> {
  const row = await db().offer.findFirst({ where: { promo: true, active: true }, orderBy: { updatedAt: "desc" } });
  return row ? toFront(row) : null;
}
```
- [ ] **Step 7: Estáticos.** Cada objeto de `ofertas.json` gana `"promo": false`. En `site.ts`, junto a `offersList: ofertas`, añadir `promo: ofertas.find((o) => o.promo && o.active) ?? null`. `EMPTY_OFFER` gana `promo: false, promoText: ""`.
- [ ] **Step 8: Verificar.** `npx tsc --noEmit`. Expected: errores solo donde falte `promo` en `SiteContent` (content.ts), que arregla la Task 2.

### Task 2: Contenido y barra en la portada

**Files:**
- Modify: `src/lib/content.ts` (loadFromDatabase)
- Create: `src/components/layout/PromoBar.tsx`
- Modify: `src/components/layout/SiteShell.tsx`
- Modify: `src/components/sections/OffersGrid.tsx` (ancla en `article`)
- Modify: `src/app/globals.css` (bloque `.promo`)

**Interfaces:**
- Consumes: `getPromoOffer`, `SiteContent.promo`.
- Produces: `<PromoBar offer={content.promo} />`.

- [ ] **Step 1: content.ts.** Importar `getPromoOffer` junto a `listOffers`; en el `Promise.all` añadir `getPromoOffer()` y en `site` poner `promo`.
- [ ] **Step 2: PromoBar.tsx:**
```tsx
"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { Offer } from "@/types/content";
import { Close, ArrowRight } from "@/components/ui/icons";

const KEY = "tb:promo-cerrada";

/** Barra dorada bajo la cabecera con la oferta marcada como promoción. Solo en la portada. */
export function PromoBar({ offer }: { offer: Offer | null }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  useEffect(() => {
    if (!offer) return;
    let closed: string | null = null;
    try { closed = window.localStorage.getItem(KEY); } catch {}
    setOpen(closed !== offer.id);
  }, [offer]);
  if (!offer || pathname !== "/") return null;
  const text = offer.promoText || `${offer.title} · desde ${offer.price}`;
  const close = () => {
    setOpen(false);
    try { window.localStorage.setItem(KEY, offer.id); } catch {}
  };
  return (
    <div className={`promo ${open ? "is-open" : ""}`} role="region" aria-label="Promoción" aria-hidden={!open}>
      <span className="promo-text">{text}</span>
      <Link href={`/ofertas#oferta-${offer.id}`} className="promo-link" tabIndex={open ? 0 : -1}>
        Ver oferta <ArrowRight width={14} height={14} />
      </Link>
      <button type="button" className="promo-close" aria-label="Cerrar aviso" onClick={close} tabIndex={open ? 0 : -1}>
        <Close width={16} height={16} />
      </button>
    </div>
  );
}
```
- [ ] **Step 3: SiteShell.** Tras `<Navbar …/>`: `<PromoBar offer={content.promo} />`.
- [ ] **Step 4: OffersGrid.** `<article key={o.id} id={`oferta-${o.id}`} className="card dest-card" data-cascade-item>`.
- [ ] **Step 5: CSS** (añadir tras el bloque "Gold nav link"):
```css
/* ---------- Promo bar (portada) ---------- */
.promo {
  position: fixed;
  top: var(--nav-h);
  left: 0;
  right: 0;
  z-index: 48;
  height: 40px;
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 0 var(--gutter);
  background: var(--gold);
  color: var(--ink);
  font-family: var(--font-mono), monospace;
  font-size: 12px;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  transform: translateY(-100%);
  opacity: 0;
  pointer-events: none;
  transition: transform 0.5s var(--ease-out), opacity 0.4s var(--ease-out);
}
.promo.is-open { transform: none; opacity: 1; pointer-events: auto; }
html.reduced-motion .promo { transition: none; }
.promo-text { flex: 1; min-width: 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.promo-link { display: inline-flex; align-items: center; gap: 6px; white-space: nowrap; text-decoration: underline; text-underline-offset: 4px; }
.promo-close { display: grid; place-items: center; width: 28px; height: 28px; margin-right: -6px; }
.dest-card { scroll-margin-top: calc(var(--nav-h) + 56px); }
@media (max-width: 560px) { .promo { gap: 10px; font-size: 11px; } }
```
- [ ] **Step 6: Verificar.** `npx tsc --noEmit && npm run lint`. Expected: sin errores.

### Task 3: Admin

**Files:**
- Modify: `src/components/admin/OfferEditor.tsx`
- Modify: `src/components/admin/OffersAdmin.tsx`
- Modify: `src/components/admin/sources.tsx` (OffersDemo.save)

- [ ] **Step 1: OfferEditor.** Bajo el check "Oferta activa":
```tsx
        <label className="check">
          <input type="checkbox" checked={o.promo} onChange={(e) => field("promo", e.target.checked)} />
          <span>Mostrar como aviso en la portada (solo puede haber una)</span>
        </label>
        {o.promo && (
          <div>
            <label className="lbl" htmlFor={`opt-${k}`}>Texto del aviso</label>
            <input id={`opt-${k}`} className="input" value={o.promoText ?? ""} onChange={(e) => field("promoText", e.target.value)} placeholder={`Si lo dejas vacío: «${o.title || "Título"} · desde ${o.price || "Precio"}»`} />
          </div>
        )}
```
- [ ] **Step 2: OffersAdmin.** Columna Estado: `{o.promo && <span className="badge promo-badge ml-2">Portada</span>}`; CSS `.promo-badge { background: var(--gold); color: var(--ink); border-color: var(--gold); }`. Mensaje al guardar: `${o.promo ? " Ahora es la promoción de portada." : ""}`.
- [ ] **Step 3: sources.tsx (demo).** En `OffersDemo.save`: `const next = offers.map((x) => (x.id === o.id ? o : o.promo ? { ...x, promo: false } : x)); save(next.some((x) => x.id === o.id) ? next : [...next, o]);`.
- [ ] **Step 4: Verificar.** `npx tsc --noEmit && npm run lint`.

### Task 4: Banner de cookies

**Files:**
- Create: `src/components/layout/CookieBanner.tsx`
- Modify: `src/app/layout.tsx`
- Modify: `src/app/globals.css` (bloque `.cookie`, regla `.wa`)

- [ ] **Step 1: CookieBanner.tsx:**
```tsx
"use client";
import { useEffect, useState } from "react";
import Link from "next/link";

const KEY = "tb:cookies";

/** Aviso de cookies: se muestra hasta que el visitante elige; la elección queda en localStorage. */
export function CookieBanner() {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    let saved: string | null = null;
    try { saved = window.localStorage.getItem(KEY); } catch {}
    setOpen(!saved);
  }, []);
  useEffect(() => {
    document.documentElement.classList.toggle("has-cookie-banner", open);
    return () => document.documentElement.classList.remove("has-cookie-banner");
  }, [open]);
  if (!open) return null;
  const choose = (v: "all" | "necessary") => {
    try { window.localStorage.setItem(KEY, v); } catch {}
    setOpen(false);
  };
  return (
    <div className="cookie" role="dialog" aria-label="Aviso de cookies">
      <div className="cookie-title">Cookies</div>
      <p className="cookie-text">
        Usamos almacenamiento local para recordar tus destinos y el formulario. Sin rastreo de terceros.{" "}
        <Link href="/cookies">Política de cookies</Link>
      </p>
      <div className="cookie-actions">
        <button type="button" className="btn btn-primary btn-sm" onClick={() => choose("all")}>Aceptar</button>
        <button type="button" className="btn btn-secondary btn-sm" onClick={() => choose("necessary")}>Solo necesarias</button>
      </div>
    </div>
  );
}
```
- [ ] **Step 2: layout.tsx.** Importar y poner `<CookieBanner />` tras `<WhatsAppFab …/>`.
- [ ] **Step 3: CSS:**
```css
/* ---------- Cookie banner ---------- */
.cookie {
  position: fixed;
  left: 20px;
  bottom: 20px;
  z-index: 90;
  max-width: 420px;
  padding: 20px 22px;
  background: var(--paper);
  border: 1px solid var(--line);
  box-shadow: 0 10px 24px rgba(0, 0, 0, 0.14);
  color: var(--ink);
}
.cookie-title { font-family: var(--font-mono), monospace; font-size: 12px; letter-spacing: 0.12em; text-transform: uppercase; }
.cookie-text { margin-top: 8px; font-size: 14px; line-height: 1.5; color: var(--muted); }
.cookie-text a { text-decoration: underline; text-underline-offset: 3px; color: var(--ink); }
.cookie-actions { display: flex; flex-wrap: wrap; gap: 10px; margin-top: 14px; }
@media (max-width: 560px) {
  .cookie { left: 0; right: 0; bottom: 0; max-width: none; border-width: 1px 0 0; }
  html.has-cookie-banner .wa { display: none; }
}
```
- [ ] **Step 4: Verificar.** `npx tsc --noEmit && npm run lint && npm run build`.

### Task 5: Despliegue y comprobación

- [ ] **Step 1:** `docker compose up -d --build` (aplica la migración al arrancar). Esperar `curl -s localhost:3000/api/health`.
- [ ] **Step 2:** En /admin/ofertas marcar una oferta como aviso; `curl -s https://turista.piq3d.com/ | grep -o 'class="promo[^"]*"'` muestra la barra. Marcar otra: la primera pierde la etiqueta "Portada".
- [ ] **Step 3:** En el navegador: barra visible en portada, no en /ofertas; cerrar y recargar no reaparece; /ofertas#oferta-<id> aterriza en la tarjeta; banner de cookies en / y /como-viajas, desaparece tras elegir.
- [ ] **Step 4:** Commit de los ficheros nuevos y tocados (avisando de los cambios previos sin commit que viajen en los ficheros compartidos).
