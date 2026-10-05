"use client";

import { KEYS_ADMIN } from "./keys";
import { readJSON, removeKey, usePersistedState, writeJSON } from "@/lib/storage";

/**
 * Mock authentication for the admin demo. There is no backend yet: the credentials
 * are checked in the browser and the session lives in localStorage.
 * Replace with Auth.js (or the API) when the database exists.
 */
export const DEMO_CREDENTIALS = { user: "admin", password: "turista2026" };

export interface AdminSession {
  user: string;
  since: string;
}

const NONE = null;

export function login(user: string, password: string): AdminSession | null {
  if (user.trim().toLowerCase() !== DEMO_CREDENTIALS.user || password !== DEMO_CREDENTIALS.password) return null;
  const session: AdminSession = { user: DEMO_CREDENTIALS.user, since: new Date().toISOString() };
  writeJSON(KEYS_ADMIN.session, session);
  return session;
}

export function logout() {
  removeKey(KEYS_ADMIN.session);
}

export function readSession(): AdminSession | null {
  return readJSON<AdminSession | null>(KEYS_ADMIN.session, NONE);
}

/** [session, hydrated] — hydrated is false during SSR/hydration. */
export function useSession(): [AdminSession | null, boolean] {
  const [session, , hydrated] = usePersistedState<AdminSession | null>(KEYS_ADMIN.session, NONE);
  return [session, hydrated];
}
