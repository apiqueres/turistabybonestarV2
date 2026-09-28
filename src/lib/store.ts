import "server-only";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";

/**
 * Minimal JSON-file store used until the backend exists.
 * Each record lands in `${DATA_DIR}/<collection>/<id>.json` (DATA_DIR defaults to ./data).
 * The future admin can import these files or replace this module with a database client.
 */
const DATA_DIR = process.env.DATA_DIR ?? path.join(process.cwd(), "data");

export interface StoredRecord<T> {
  id: string;
  createdAt: string;
  data: T;
}

export async function saveRecord<T>(
  collection: "solicitudes" | "contacto",
  data: T,
  /** Optional plain-text companion (e.g. the admin prompt), saved as <id>.txt */
  text?: (id: string, createdAt: string) => string,
): Promise<StoredRecord<T> & { prompt?: string }> {
  const now = new Date();
  const id = `${now.toISOString().replace(/[:.]/g, "-")}_${randomUUID().slice(0, 8)}`;
  const dir = path.join(DATA_DIR, collection);
  await mkdir(dir, { recursive: true });
  const createdAt = now.toISOString();
  const prompt = text?.(id, createdAt);
  const record = { id, createdAt, data, ...(prompt ? { prompt } : {}) };
  await writeFile(path.join(dir, `${id}.json`), JSON.stringify(record, null, 2), "utf8");
  if (prompt) await writeFile(path.join(dir, `${id}.txt`), prompt, "utf8");
  return record;
}
