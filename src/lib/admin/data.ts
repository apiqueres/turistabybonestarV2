"use client";

import { useMemo } from "react";
import type { Destination, Offer } from "@/types/content";
import type { FormStep } from "@/types/form";
import type { SolicitudInput } from "@/lib/validation";
import { usePersistedState } from "@/lib/storage";
import { KEYS_ADMIN } from "./keys";
import { mockSolicitudes, type StoredRequest } from "@/data/mock-solicitudes";
import baseDestinations from "@/data/destinations.json";
import baseOffers from "@/data/ofertas.json";
import { formContent } from "@/data/form";

/**
 * Admin data sources for the mock. Each collection starts from the static data of the site
 * and keeps the admin's edits in localStorage. Swap these hooks for API calls when the
 * database exists; the components only depend on their return shape.
 */

interface DemoSubmission {
  id: string;
  createdAt: string;
  data: SolicitudInput;
}

const NO_DEMO: DemoSubmission[] = [];
const NO_OVERRIDES: Record<string, Partial<StoredRequest>> = {};

/** Sample requests + the ones submitted in this browser (static demo), with status/notes overrides. */
export function useRequests() {
  const [demo] = usePersistedState<DemoSubmission[]>("tb:demo-solicitudes", NO_DEMO);
  const [overrides, setOverrides] = usePersistedState<Record<string, Partial<StoredRequest>>>(KEYS_ADMIN.requests, NO_OVERRIDES);

  const requests = useMemo(() => {
    const fromDemo: StoredRequest[] = demo.map((d) => ({ id: d.id, createdAt: d.createdAt, data: d.data, status: "nueva" as const }));
    const all = [...fromDemo, ...mockSolicitudes].map((r) => ({ ...r, ...(overrides[r.id] ?? {}) }));
    return all.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
  }, [demo, overrides]);

  const update = (id: string, patch: Partial<StoredRequest>) => setOverrides((o) => ({ ...o, [id]: { ...(o[id] ?? {}), ...patch } }));
  return { requests, update };
}

const BASE_DESTINATIONS = baseDestinations as Destination[];

/** Destinations with admin edits applied. */
export function useDestinations() {
  const [stored, setStored, hydrated] = usePersistedState<Destination[] | null>(KEYS_ADMIN.destinations, null);
  const destinations = stored ?? BASE_DESTINATIONS;
  const save = (next: Destination[]) => setStored(next);
  const reset = () => setStored(null);
  return { destinations, save, reset, dirty: stored !== null, hydrated };
}

const BASE_STEPS = formContent.steps;

/** Wizard steps with admin edits applied. */
export function useFormSteps() {
  const [stored, setStored, hydrated] = usePersistedState<FormStep[] | null>(KEYS_ADMIN.form, null);
  const steps = stored ?? BASE_STEPS;
  const save = (next: FormStep[]) => setStored(next);
  const reset = () => setStored(null);
  return { steps, save, reset, dirty: stored !== null, hydrated };
}

const BASE_OFFERS = baseOffers as Offer[];

/** Offers with admin edits applied. Also used by the public /ofertas page so the demo reflects edits. */
export function useOffers() {
  const [stored, setStored, hydrated] = usePersistedState<Offer[] | null>(KEYS_ADMIN.offers, null);
  const offers = stored ?? BASE_OFFERS;
  const save = (next: Offer[]) => setStored(next);
  const reset = () => setStored(null);
  return { offers, save, reset, dirty: stored !== null, hydrated };
}
