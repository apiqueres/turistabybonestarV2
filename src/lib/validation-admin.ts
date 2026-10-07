import { z } from "zod";

/** Esquemas de las operaciones del admin (rutas /api/admin/*). Compartidos con los formularios. */

export const passwordChangeSchema = z
  .object({
    current: z.string().min(1, "Escribe tu contraseña actual").max(200),
    next: z.string().min(10, "Mínimo 10 caracteres").max(200),
    confirm: z.string().max(200),
  })
  .refine((v) => v.next === v.confirm, { path: ["confirm"], message: "Las contraseñas no coinciden" });

export type PasswordChangeInput = z.infer<typeof passwordChangeSchema>;
