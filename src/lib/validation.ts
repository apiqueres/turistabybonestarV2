import { z } from "zod";

/** Shared by the API routes (server) and the forms (client). */

const answerValue = z.union([
  z.string().max(2000),
  z.array(z.string().max(120)).max(40),
  z.number().finite(),
  z.boolean(),
]);

export const solicitudSchema = z.object({
  destinos: z.array(z.object({ id: z.string().max(12), nombre: z.string().max(80) })).min(1, "Marca al menos un destino").max(40),
  respuestas: z.record(z.string().max(60), answerValue),
  contacto: z.object({
    nombre: z.string().trim().min(2, "Escribe tu nombre").max(120),
    email: z.string().trim().email("Revisa el correo").max(200),
    telefono: z.string().trim().max(40).optional().or(z.literal("")),
    canal: z.string().max(40).optional().or(z.literal("")),
    privacidad: z.literal(true, { message: "Tienes que aceptar la política de privacidad" }),
  }),
});

export const contactoSchema = z.object({
  nombre: z.string().trim().min(2, "Escribe tu nombre").max(120),
  email: z.string().trim().email("Revisa el correo").max(200),
  telefono: z.string().trim().max(40).optional().or(z.literal("")),
  mensaje: z.string().trim().min(5, "Cuéntanos un poco más").max(3000),
  privacidad: z.literal(true, { message: "Tienes que aceptar la política de privacidad" }),
});

export type SolicitudInput = z.infer<typeof solicitudSchema>;
export type ContactoInput = z.infer<typeof contactoSchema>;
