import "server-only";
import path from "node:path";

/** Carpeta de subidas: ${DATA_DIR}/uploads (en Docker, /app/data/uploads montado desde ./data). */
export const DATA_DIR = process.env.DATA_DIR ?? path.join(process.cwd(), "data");
export const UPLOADS_DIR = path.join(DATA_DIR, "uploads");
export const UPLOAD_MAX_BYTES = (Number(process.env.UPLOAD_MAX_MB) || 10) * 1024 * 1024;

/** Ruta pública válida: /uploads/AAAA/MM/<id>.webp (sin «..» ni barras extra). */
export const UPLOAD_PATH_RE = /^\/uploads\/\d{4}\/\d{2}\/[a-z0-9]{20,40}\.webp$/;

/** Convierte una ruta pública validada en la ruta de disco; null si no es válida. */
export function diskPath(publicPath: string): string | null {
  if (!UPLOAD_PATH_RE.test(publicPath)) return null;
  const rel = publicPath.slice("/uploads/".length);
  const abs = path.resolve(UPLOADS_DIR, rel);
  return abs.startsWith(path.resolve(UPLOADS_DIR) + path.sep) ? abs : null;
}
