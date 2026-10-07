/** Claves de localStorage del admin en la DEMO estática (GitHub Pages). En el VPS el panel usa la base de datos. */
export const KEYS_ADMIN = {
  session: "tb:admin-session",
  requests: "tb:admin-solicitudes",
  destinations: "tb:admin-destinos",
  form: "tb:admin-preguntas",
  offers: "tb:admin-ofertas",
} as const;
