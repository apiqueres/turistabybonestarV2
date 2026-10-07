"use client";

import { useRouter, useSearchParams } from "next/navigation";
import type { Destination, Offer } from "@/types/content";
import type { FormStep } from "@/types/form";
import type { EmailBrand } from "@/lib/email-shell";
import type { AdminMessage } from "@/lib/email-templates";
import type { RequestStatus, StoredRequest } from "@/types/admin";
import { api } from "@/lib/admin/api";
import { useDestinations, useFormSteps, useOffers, useRequests } from "@/lib/admin/data";
import { clientMessageEmail } from "@/lib/email-templates";
import { openMailto } from "@/lib/mailto";
import { paginate } from "./Pager";
import { DestinationsAdmin } from "./DestinationsAdmin";
import { OffersAdmin } from "./OffersAdmin";
import { QuestionsAdmin } from "./QuestionsAdmin";
import { RequestsAdmin } from "./RequestsAdmin";

/**
 * Fuentes de datos de cada sección del admin. Los componentes solo conocen estas interfaces:
 *  - *Db:   datos cargados en el servidor (página) + mutaciones vía /api/admin/* + router.refresh().
 *  - *Demo: datos estáticos + localStorage (demo de GitHub Pages, sin servidor).
 */
export type Mode = "db" | "demo";

export interface ListStore<T> {
  items: T[];
  mode: Mode;
  save: (item: T, previousId?: string) => Promise<void>;
  remove: (id: string) => Promise<void>;
  reorder: (ids: string[]) => Promise<void>;
  reset?: () => void;
  dirty?: boolean;
}

export interface StepsStore {
  steps: FormStep[];
  mode: Mode;
  save: (steps: FormStep[]) => Promise<void>;
  reset?: () => void;
  dirty?: boolean;
}

export type RequestFilter = RequestStatus | "todas";
export interface RequestsStore {
  rows: StoredRequest[];
  total: number;
  page: number;
  counts: Record<RequestFilter, number>;
  filter: RequestFilter;
  q: string;
  mode: Mode;
  setFilter: (f: RequestFilter) => void;
  setPage: (p: number) => void;
  setQuery: (q: string) => void;
  update: (id: string, patch: { status?: RequestStatus; notes?: string }) => Promise<void>;
  remove: (id: string) => Promise<void>;
  /** Envía el correo al cliente y devuelve un resumen para mostrar. */
  sendMessage: (request: StoredRequest, msg: AdminMessage, brand: EmailBrand) => Promise<string>;
}

/* ---------------- Destinos ---------------- */

export function DestinationsDb({ initial }: { initial: Destination[] }) {
  const router = useRouter();
  const store: ListStore<Destination> = {
    items: initial,
    mode: "db",
    save: async (d, previousId) => {
      await api("/api/admin/destinos", { method: "PUT", body: { destination: d, previousId } });
      router.refresh();
    },
    remove: async (id) => {
      await api(`/api/admin/destinos/${encodeURIComponent(id)}`, { method: "DELETE" });
      router.refresh();
    },
    reorder: async (ids) => {
      await api("/api/admin/destinos", { method: "PATCH", body: { ids } });
      router.refresh();
    },
  };
  return <DestinationsAdmin store={store} />;
}

export function DestinationsDemo() {
  const { destinations, save, reset, dirty, hydrated } = useDestinations();
  if (!hydrated) return null;
  const store: ListStore<Destination> = {
    items: destinations,
    mode: "demo",
    dirty,
    reset,
    save: async (d, previousId) => {
      const key = previousId ?? d.id;
      save(destinations.some((x) => x.id === key) ? destinations.map((x) => (x.id === key ? d : x)) : [...destinations, d]);
    },
    remove: async (id) => save(destinations.filter((x) => x.id !== id)),
    reorder: async (ids) => save(ids.map((id) => destinations.find((x) => x.id === id)).filter((x): x is Destination => Boolean(x))),
  };
  return <DestinationsAdmin store={store} />;
}

/* ---------------- Ofertas ---------------- */

export function OffersDb({ initial, destinations }: { initial: Offer[]; destinations: Destination[] }) {
  const router = useRouter();
  const store: ListStore<Offer> = {
    items: initial,
    mode: "db",
    save: async (o) => {
      await api("/api/admin/ofertas", { method: "PUT", body: o });
      router.refresh();
    },
    remove: async (id) => {
      await api(`/api/admin/ofertas/${encodeURIComponent(id)}`, { method: "DELETE" });
      router.refresh();
    },
    reorder: async (ids) => {
      await api("/api/admin/ofertas", { method: "PATCH", body: { ids } });
      router.refresh();
    },
  };
  return <OffersAdmin store={store} destinations={destinations} />;
}

export function OffersDemo() {
  const { offers, save, reset, dirty, hydrated } = useOffers();
  const { destinations } = useDestinations();
  if (!hydrated) return null;
  const store: ListStore<Offer> = {
    items: offers,
    mode: "demo",
    dirty,
    reset,
    save: async (o) => save(offers.some((x) => x.id === o.id) ? offers.map((x) => (x.id === o.id ? o : x)) : [o, ...offers]),
    remove: async (id) => save(offers.filter((x) => x.id !== id)),
    reorder: async (ids) => save(ids.map((id) => offers.find((x) => x.id === id)).filter((x): x is Offer => Boolean(x))),
  };
  return <OffersAdmin store={store} destinations={destinations} />;
}

/* ---------------- Preguntas ---------------- */

export function QuestionsDb({ initial }: { initial: FormStep[] }) {
  const router = useRouter();
  const store: StepsStore = {
    steps: initial,
    mode: "db",
    save: async (steps) => {
      await api("/api/admin/preguntas", { method: "PUT", body: steps });
      router.refresh();
    },
  };
  return <QuestionsAdmin store={store} />;
}

export function QuestionsDemo() {
  const { steps, save, reset, dirty, hydrated } = useFormSteps();
  if (!hydrated) return null;
  const store: StepsStore = { steps, mode: "demo", dirty, reset, save: async (next) => save(next) };
  return <QuestionsAdmin store={store} />;
}

/* ---------------- Solicitudes ---------------- */

export interface RequestsPageData {
  rows: StoredRequest[];
  total: number;
  page: number;
  counts: Record<RequestFilter, number>;
}

const requestsUrl = (filter: RequestFilter, q: string, page: number) => {
  const p = new URLSearchParams();
  if (filter !== "todas") p.set("estado", filter);
  if (q) p.set("q", q);
  if (page > 1) p.set("page", String(page));
  const qs = p.toString();
  return `/admin/solicitudes${qs ? `?${qs}` : ""}`;
};

export function RequestsDb({ data, filter, q, steps, brand }: { data: RequestsPageData; filter: RequestFilter; q: string; steps: FormStep[]; brand: EmailBrand }) {
  const router = useRouter();
  const store: RequestsStore = {
    ...data,
    filter,
    q,
    mode: "db",
    setFilter: (f) => router.push(requestsUrl(f, q, 1)),
    setQuery: (next) => router.push(requestsUrl(filter, next, 1)),
    setPage: (p) => router.push(requestsUrl(filter, q, p)),
    update: async (id, patch) => {
      await api(`/api/admin/solicitudes/${encodeURIComponent(id)}`, { method: "PATCH", body: patch });
      router.refresh();
    },
    remove: async (id) => {
      await api(`/api/admin/solicitudes/${encodeURIComponent(id)}`, { method: "DELETE" });
      router.refresh();
    },
    sendMessage: async (request, msg) => {
      const res = await api<{ to: string }>(`/api/admin/solicitudes/${encodeURIComponent(request.id)}/mensaje`, { method: "POST", body: msg });
      router.refresh();
      return `Correo enviado a ${res.to}.`;
    },
  };
  return <RequestsAdmin store={store} steps={steps} brand={brand} />;
}

const FILTERS: RequestFilter[] = ["todas", "nueva", "en-curso", "cerrada"];

/** Demo estática: el filtro, la búsqueda y la página se leen de la URL en el navegador (no hay servidor). */
export function RequestsDemo({ brand }: { brand: EmailBrand }) {
  const router = useRouter();
  const params = useSearchParams();
  const estado = params.get("estado") as RequestFilter | null;
  const filter: RequestFilter = estado && FILTERS.includes(estado) ? estado : "todas";
  const q = params.get("q") ?? "";
  const page = Number(params.get("page")) || 1;
  const { requests, update, remove } = useRequests();
  const { steps } = useFormSteps();
  const needle = q.trim().toLowerCase();
  const filtered = requests.filter((r) => {
    if (filter !== "todas" && r.status !== filter) return false;
    if (!needle) return true;
    const hay = [r.data.contacto.nombre, r.data.contacto.email, r.data.contacto.telefono, r.id, ...r.data.destinos.map((d) => d.nombre)].join(" ").toLowerCase();
    return hay.includes(needle);
  });
  const { rows, current } = paginate(filtered, page);
  const counts: Record<RequestFilter, number> = { todas: requests.length, nueva: 0, "en-curso": 0, cerrada: 0 };
  for (const r of requests) counts[r.status]++;
  const store: RequestsStore = {
    rows,
    total: filtered.length,
    page: current,
    counts,
    filter,
    q,
    mode: "demo",
    setFilter: (f) => router.push(requestsUrl(f, q, 1)),
    setQuery: (next) => router.push(requestsUrl(filter, next, 1)),
    setPage: (p) => router.push(requestsUrl(filter, q, p)),
    update: async (id, patch) => update(id, patch),
    remove: async (id) => remove(id),
    sendMessage: async (request, msg, b) => {
      const email = clientMessageEmail(request.id, request.data, msg, b);
      openMailto({ to: request.data.contacto.email, subject: email.subject, text: email.text });
      update(request.id, { notes: `${request.notes ? `${request.notes}\n` : ""}Correo enviado · ${new Date().toLocaleString("es-ES")} · ${email.subject}` });
      return "Se ha abierto tu programa de correo con la versión en texto (demo sin servidor).";
    },
  };
  return <RequestsAdmin store={store} steps={steps} brand={brand} />;
}
