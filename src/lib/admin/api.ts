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
