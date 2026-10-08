import { notFound } from "next/navigation";
import { TextsAdmin, type TextBlock } from "@/components/admin/TextsAdmin";
import type { Json } from "@/components/admin/BlockEditor";
import { STATIC_DEMO } from "@/lib/config";
import { requireUser } from "@/lib/admin/session";
import { db } from "@/lib/db";
import { SETTING_KEYS } from "@/lib/repo/settings";
import { SETTING_LABELS, fixedListPaths, settingSchemas } from "@/lib/validation-admin";
import { siteContent } from "@/data/site";

/** Valor estático de un bloque (por si aún no está en la base de datos). */
function staticBlock(key: string): Json {
  const [root, sub] = key.split(".");
  const base = (siteContent as unknown as Record<string, Json>)[root];
  return sub && base && typeof base === "object" && !Array.isArray(base) ? (base as Record<string, Json>)[sub] : base;
}

export default async function TextsPage() {
  if (STATIC_DEMO) notFound();
  await requireUser();
  const rows = await db().siteSetting.findMany();
  const byKey = new Map(rows.map((r) => [r.key, r]));
  const blocks: TextBlock[] = SETTING_KEYS.map((key) => {
    const row = byKey.get(key);
    return { key, label: SETTING_LABELS[key], data: (row?.data as Json) ?? staticBlock(key), updatedAt: row?.updatedAt.toISOString(), fixedLists: fixedListPaths(settingSchemas[key]) };
  });
  return <TextsAdmin blocks={blocks} />;
}
