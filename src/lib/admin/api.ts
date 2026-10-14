"use client";

/** Cliente mínimo de /api/admin/*: lanza Error(mensaje) cuando la respuesta no es ok. */
export async function api<T = { ok: true }>(path: string, init: { method?: string; body?: unknown } = {}): Promise<T> {
  const res = await fetch(path, {
    method: init.method ?? "GET",
    headers: init.body !== undefined ? { "Content-Type": "application/json" } : undefined,
    body: init.body !== undefined ? JSON.stringify(init.body) : undefined,
  });
  const json = (await res.json().catch(() => ({}))) as { ok?: boolean; error?: string } & T;
  if (res.status === 401) throw new Error("La sesión ha caducado: vuelve a entrar en /admin/login.");
  if (!res.ok || json.ok === false) throw new Error(json.error ?? `Error ${res.status}`);
  return json;
}

/** Igual que `api`, pero envía un FormData (mensajes con adjuntos). */
export async function apiForm<T = { ok: true }>(path: string, form: FormData): Promise<T> {
  const res = await fetch(path, { method: "POST", body: form });
  const json = (await res.json().catch(() => ({}))) as { ok?: boolean; error?: string } & T;
  if (res.status === 401) throw new Error("La sesión ha caducado: vuelve a entrar en /admin/login.");
  if (!res.ok || json.ok === false) throw new Error(json.error ?? `Error ${res.status}`);
  return json;
}

/** FormData de un mensaje del panel: el borrador como JSON en `message` y los archivos en `files`. */
export function messageForm(msg: unknown, files: File[]): FormData {
  const form = new FormData();
  form.append("message", JSON.stringify(msg));
  for (const f of files) form.append("files", f, f.name);
  return form;
}
