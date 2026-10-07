"use client";

import { useCallback, useMemo, useSyncExternalStore } from "react";

/**
 * localStorage as an external store (SSR-safe). State shared between the map and the wizard.
 * Components read through `usePersistedState`; every write notifies all subscribers.
 */

export const KEYS = {
  selection: "tb:seleccion",
  places: "tb:lugares",
  form: "tb:formulario",
} as const;

const listeners = new Set<() => void>();

function subscribe(cb: () => void) {
  listeners.add(cb);
  window.addEventListener("storage", cb);
  return () => {
    listeners.delete(cb);
    window.removeEventListener("storage", cb);
  };
}

function parse<T>(raw: string | null | undefined, fallback: T): T {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function readJSON<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    return parse(window.localStorage.getItem(key), fallback);
  } catch {
    return fallback;
  }
}

export function writeJSON(key: string, value: unknown) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* storage unavailable (private mode, quota) */
  }
  listeners.forEach((cb) => cb());
}

export function removeKey(key: string) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(key);
  } catch {
    /* ignore */
  }
  listeners.forEach((cb) => cb());
}

/**
 * Returns [value, set, hydrated]. `fallback` must be a stable reference (module constant).
 * On the server and during hydration `hydrated` is false and `value` is the fallback.
 */
export function usePersistedState<T>(key: string, fallback: T): [T, (next: T | ((prev: T) => T)) => void, boolean] {
  const raw = useSyncExternalStore(
    subscribe,
    () => {
      try {
        return window.localStorage.getItem(key);
      } catch {
        return null;
      }
    },
    () => undefined,
  );
  const hydrated = raw !== undefined;
  const value = useMemo(() => parse(raw, fallback), [raw, fallback]);
  const set = useCallback(
    (next: T | ((prev: T) => T)) => {
      const resolved = typeof next === "function" ? (next as (prev: T) => T)(readJSON(key, fallback)) : next;
      writeJSON(key, resolved);
    },
    [key, fallback],
  );
  return [value, set, hydrated];
}
