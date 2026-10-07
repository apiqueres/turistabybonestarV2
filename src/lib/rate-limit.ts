import "server-only";

/**
 * Límite de peticiones por IP en memoria (ventana deslizante). Suficiente para un solo
 * contenedor; si algún día hay varias réplicas, sustituir por Redis.
 */
const buckets = new Map<string, number[]>();
let lastSweep = Date.now();

function sweep(now: number, windowMs: number) {
  if (now - lastSweep < windowMs) return;
  lastSweep = now;
  for (const [k, hits] of buckets) {
    const live = hits.filter((t) => now - t < windowMs);
    if (live.length) buckets.set(k, live);
    else buckets.delete(k);
  }
}

/** true si la petición puede pasar; false si `key` superó `max` en los últimos `windowMs`. */
export function allow(key: string, max = 5, windowMs = 10 * 60 * 1000): boolean {
  const now = Date.now();
  sweep(now, windowMs);
  const hits = (buckets.get(key) ?? []).filter((t) => now - t < windowMs);
  if (hits.length >= max) {
    buckets.set(key, hits);
    return false;
  }
  hits.push(now);
  buckets.set(key, hits);
  return true;
}

/** IP del cliente detrás de Nginx (X-Real-IP / X-Forwarded-For). */
export function clientIp(req: Request): string {
  const h = req.headers;
  return h.get("x-real-ip") ?? h.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
}

/** Campo trampa para bots: si viene relleno, la petición se ignora sin avisar. */
export const HONEYPOT_FIELD = "website";
export function isHoneypotFilled(body: unknown): boolean {
  if (!body || typeof body !== "object") return false;
  const v = (body as Record<string, unknown>)[HONEYPOT_FIELD];
  return typeof v === "string" && v.trim().length > 0;
}
