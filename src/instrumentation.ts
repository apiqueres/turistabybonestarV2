/**
 * Arranque del servidor Next (una vez por proceso). Programa la limpieza de datos que promete la
 * política de privacidad. Solo en el servidor Node con base de datos; RETENTION_DISABLED=1 la apaga.
 */
export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  if (process.env.NEXT_PUBLIC_STATIC_DEMO === "1" || process.env.RETENTION_DISABLED === "1") return;
  if (!process.env.DATABASE_URL) return;
  const { startRetentionScheduler } = await import("@/lib/retention-scheduler");
  startRetentionScheduler();
}
