import { NextResponse } from "next/server";
import { mkdir, unlink, writeFile } from "node:fs/promises";
import { randomBytes } from "node:crypto";
import path from "node:path";
import sharp from "sharp";
import { z } from "zod";
import { requireApiUser } from "@/lib/admin/session";
import { parseBody } from "@/lib/admin/api-utils";
import { createAsset, deleteAssetByPath } from "@/lib/repo/media";
import { diskPath, UPLOADS_DIR, UPLOAD_MAX_BYTES } from "@/lib/uploads";

export const runtime = "nodejs";

const MAX_SIDE = 1600;
const QUALITY = 82;
const ALLOWED = new Set(["jpeg", "png", "webp", "gif", "avif", "tiff", "heif"]);

/**
 * Subida de imágenes (multipart, campo `file`, opcional `alt`): comprueba el tipo real con sharp,
 * redimensiona a 1600 px como máximo, convierte a WebP y guarda en DATA_DIR/uploads/AAAA/MM/.
 */
export async function POST(req: Request) {
  const { error } = await requireApiUser();
  if (error) return error;
  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json({ ok: false, error: "Se esperaba un formulario multipart" }, { status: 400 });
  }
  const file = form.get("file");
  if (!(file instanceof File)) return NextResponse.json({ ok: false, error: "Falta el archivo" }, { status: 400 });
  if (file.size === 0) return NextResponse.json({ ok: false, error: "El archivo está vacío" }, { status: 400 });
  if (file.size > UPLOAD_MAX_BYTES) return NextResponse.json({ ok: false, error: `La imagen supera el máximo (${Math.round(UPLOAD_MAX_BYTES / 1024 / 1024)} MB)` }, { status: 413 });
  const alt = String(form.get("alt") ?? "").slice(0, 300) || undefined;

  try {
    const input = Buffer.from(await file.arrayBuffer());
    // El tipo real lo decide sharp leyendo los bytes, no la extensión ni el Content-Type.
    const meta = await sharp(input).metadata().catch(() => null);
    if (!meta?.format || !ALLOWED.has(meta.format)) return NextResponse.json({ ok: false, error: "El archivo no es una imagen admitida (JPG, PNG, WebP, GIF, AVIF)" }, { status: 415 });
    const out = await sharp(input, { animated: false })
      .rotate()
      .resize({ width: MAX_SIDE, height: MAX_SIDE, fit: "inside", withoutEnlargement: true })
      .webp({ quality: QUALITY })
      .toBuffer({ resolveWithObject: true });

    const now = new Date();
    const yyyy = String(now.getUTCFullYear());
    const mm = String(now.getUTCMonth() + 1).padStart(2, "0");
    const id = randomBytes(12).toString("hex");
    const dir = path.join(UPLOADS_DIR, yyyy, mm);
    await mkdir(dir, { recursive: true });
    await writeFile(path.join(dir, `${id}.webp`), out.data);
    const publicPath = `/uploads/${yyyy}/${mm}/${id}.webp`;
    const asset = await createAsset({ path: publicPath, width: out.info.width, height: out.info.height, bytes: out.info.size, alt });
    return NextResponse.json({ ok: true, path: asset.path, width: asset.width, height: asset.height, bytes: asset.bytes });
  } catch (err) {
    console.error("[admin/media] no se pudo procesar la imagen", err);
    return NextResponse.json({ ok: false, error: "No se pudo procesar la imagen" }, { status: 500 });
  }
}

/** Borra una imagen subida (cuerpo: { path: "/uploads/AAAA/MM/<id>.webp" }). */
export async function DELETE(req: Request) {
  const { error } = await requireApiUser();
  if (error) return error;
  const { data, error: bad } = await parseBody(req, z.object({ path: z.string().max(200) }));
  if (bad) return bad;
  const abs = diskPath(data.path);
  if (!abs) return NextResponse.json({ ok: false, error: "Ruta no válida" }, { status: 400 });
  try {
    await unlink(abs).catch(() => undefined);
    await deleteAssetByPath(data.path);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[admin/media] no se pudo borrar", err);
    return NextResponse.json({ ok: false, error: "No se pudo borrar" }, { status: 500 });
  }
}
