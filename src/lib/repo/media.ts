import "server-only";
import { db } from "@/lib/db";

export interface MediaInfo {
  id: string;
  path: string;
  width: number;
  height: number;
  bytes: number;
}

export async function createAsset(a: { path: string; width: number; height: number; bytes: number; alt?: string }): Promise<MediaInfo> {
  const row = await db().mediaAsset.create({ data: { ...a, alt: a.alt ?? null } });
  return { id: row.id, path: row.path, width: row.width, height: row.height, bytes: row.bytes };
}

export async function getAssetByPath(path: string): Promise<MediaInfo | null> {
  const row = await db().mediaAsset.findUnique({ where: { path } });
  return row ? { id: row.id, path: row.path, width: row.width, height: row.height, bytes: row.bytes } : null;
}

export async function deleteAssetByPath(path: string): Promise<void> {
  await db().mediaAsset.deleteMany({ where: { path } });
}
