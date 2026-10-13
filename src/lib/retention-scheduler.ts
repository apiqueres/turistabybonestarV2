import "server-only";
import { runRetention } from "@/lib/repo/retention";

const DAY = 24 * 60 * 60 * 1000;
/** Espera tras el arranque antes de la primera pasada (5 min; RETENTION_FIRST_RUN_MS la cambia, útil en pruebas). */
const FIRST_RUN_DELAY = Number(process.env.RETENTION_FIRST_RUN_MS) || 5 * 60 * 1000;

let started = false;

async function pass() {
  try {
    const r = await runRetention();
    if (r.anonymised || r.purgedContacts) console.log(`[retention] solicitudes anonimizadas: ${r.anonymised}; contactos borrados: ${r.purgedContacts}`);
  } catch (err) {
    console.error("[retention] fallo en la pasada de limpieza", err);
  }
}

/** Una pasada a los pocos minutos de arrancar y luego una al día. Idempotente por proceso. */
export function startRetentionScheduler() {
  if (started) return;
  started = true;
  const first = setTimeout(() => {
    void pass();
    setInterval(() => void pass(), DAY).unref();
  }, FIRST_RUN_DELAY);
  first.unref();
  console.log(`[retention] programada: solicitudes cerradas a 24 meses, contactos atendidos a 12 meses (cada 24 h)`);
}
