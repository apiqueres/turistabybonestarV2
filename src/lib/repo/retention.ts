import "server-only";
import { db } from "@/lib/db";
import { anonymiseClosed } from "./solicitudes";

/** Plazos de la política de privacidad (/privacidad). */
export const RETENTION = {
  /** Solicitudes cerradas: meses hasta anonimizar (nombre, correo y teléfono). */
  closedRequestsMonths: 24,
  /** Mensajes de contacto atendidos: meses hasta borrarlos. */
  handledContactsMonths: 12,
} as const;

const monthsAgo = (months: number) => {
  const d = new Date();
  d.setMonth(d.getMonth() - months);
  return d;
};

/** Borra los mensajes de contacto atendidos hace más de `months` meses. */
export async function purgeHandledContacts(months = RETENTION.handledContactsMonths): Promise<number> {
  const { count } = await db().contacto.deleteMany({ where: { handled: true, handledAt: { lt: monthsAgo(months) } } });
  return count;
}

/** Aplica los dos plazos. Devuelve cuántos registros tocó cada paso. */
export async function runRetention(): Promise<{ anonymised: number; purgedContacts: number }> {
  const anonymised = await anonymiseClosed(RETENTION.closedRequestsMonths);
  const purgedContacts = await purgeHandledContacts();
  return { anonymised, purgedContacts };
}
