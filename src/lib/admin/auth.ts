"use client";

import { KEYS_ADMIN } from "./keys";
import { readJSON, removeKey, usePersistedState, writeJSON } from "@/lib/storage";

/**
 * Sesión de la DEMO estática (GitHub Pages), sin servidor: unas credenciales de muestra
 * comprobadas en el navegador y la sesión en localStorage. Solo se usa con
 * NEXT_PUBLIC_STATIC_DEMO=1; en el VPS el acceso lo gestiona Auth.js (src/auth.ts).
 */
export const DEMO_CREDENTIALS = { user: "admin", password: "turista2026" };

export interface DemoSession {
  user: string;
  since: string;
}

const NONE = null;

export function demoLogin(user: string, password: string): DemoSession | null {
  if (user.trim().toLowerCase() !== DEMO_CREDENTIALS.user || password !== DEMO_CREDENTIALS.password) return null;
  const session: DemoSession = { user: DEMO_CREDENTIALS.user, since: new Date().toISOString() };
  writeJSON(KEYS_ADMIN.session, session);
  return session;
}

export function demoLogout() {
  removeKey(KEYS_ADMIN.session);
}

export function readDemoSession(): DemoSession | null {
  return readJSON<DemoSession | null>(KEYS_ADMIN.session, NONE);
}

/** [session, hydrated] — hydrated is false during SSR/hydration. */
export function useDemoSession(): [DemoSession | null, boolean] {
  const [session, , hydrated] = usePersistedState<DemoSession | null>(KEYS_ADMIN.session, NONE);
  return [session, hydrated];
}
