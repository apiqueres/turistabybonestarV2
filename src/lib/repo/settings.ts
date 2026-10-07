import "server-only";
import { db } from "@/lib/db";

/** Claves de los bloques editables de SiteContent. "home.x" se fusiona dentro de `home`. */
export const SETTING_KEYS = [
  "brand",
  "nav",
  "home.hero",
  "home.method",
  "home.destinations",
  "home.about",
  "home.dimensions",
  "home.pain",
  "home.team",
  "home.closing",
  "map",
  "contact",
  "offers",
  "footer",
] as const;
export type SettingKey = (typeof SETTING_KEYS)[number];

export const isSettingKey = (k: string): k is SettingKey => (SETTING_KEYS as readonly string[]).includes(k);

/** Todos los bloques guardados, por clave. */
export async function getSettings(): Promise<Partial<Record<SettingKey, unknown>>> {
  const rows = await db().siteSetting.findMany();
  const out: Partial<Record<SettingKey, unknown>> = {};
  for (const r of rows) if (isSettingKey(r.key)) out[r.key] = r.data;
  return out;
}

export async function getSetting(key: SettingKey): Promise<unknown | null> {
  const row = await db().siteSetting.findUnique({ where: { key } });
  return row?.data ?? null;
}

export async function saveSetting(key: SettingKey, data: unknown): Promise<void> {
  await db().siteSetting.upsert({
    where: { key },
    create: { key, data: data as object },
    update: { data: data as object },
  });
}
