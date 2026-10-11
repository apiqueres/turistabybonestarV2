"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/admin/api";

export interface UserRow {
  id: string;
  name: string;
  email: string;
  role: "admin" | "gestor";
  active: boolean;
  mustChangePassword: boolean;
  lastLoginAt: string | null;
  gmailConnected: boolean;
  gmailUser: string | null;
}

const ROLE: Record<UserRow["role"], string> = { admin: "Administrador", gestor: "Gestor" };
const fmt = (iso: string | null) => (iso ? new Date(iso).toLocaleString("es-ES", { dateStyle: "short", timeStyle: "short" }) : "Nunca");

/** Sección Usuarios (solo admin): estado, rol, Gmail conectado, activar/desactivar y restablecer contraseña. */
export function UsersAdmin({ users, selfId }: { users: UserRow[]; selfId: string }) {
  const router = useRouter();
  const [msg, setMsg] = useState<{ text: string; temporal?: string } | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  const run = async (id: string, fn: () => Promise<{ text: string; temporal?: string }>) => {
    setBusy(id);
    try {
      setMsg(await fn());
      router.refresh();
    } catch (err) {
      setMsg({ text: err instanceof Error ? err.message : "No se pudo completar la acción." });
    } finally {
      setBusy(null);
    }
  };

  const toggle = (u: UserRow) =>
    run(u.id, async () => {
      await api(`/api/admin/usuarios/${encodeURIComponent(u.id)}`, { method: "PATCH", body: { active: !u.active } });
      return { text: `${u.name} ${u.active ? "desactivado" : "activado"}.` };
    });

  const reset = (u: UserRow) => {
    if (!window.confirm(`¿Restablecer la contraseña de ${u.name}? La actual dejará de funcionar.`)) return;
    void run(u.id, async () => {
      const res = await api<{ temporal: string }>(`/api/admin/usuarios/${encodeURIComponent(u.id)}/clave`, { method: "POST" });
      return { text: `Contraseña temporal de ${u.name}. Cópiala ahora: no se volverá a mostrar. Deberá cambiarla al entrar.`, temporal: res.temporal };
    });
  };

  return (
    <>
      {msg && (
        <div className="card card-pad flex flex-col gap-2 mb-6">
          <span className="form-status">{msg.text}</span>
          {msg.temporal && <code className="t-body break-all">{msg.temporal}</code>}
        </div>
      )}
      <div className="card overflow-x-auto">
        <table className="table">
          <thead>
            <tr>
              <th>Nombre</th><th>Correo</th><th>Rol</th><th>Gmail</th><th>Último acceso</th><th>Estado</th><th></th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id}>
                <td>
                  {u.name}
                  {u.mustChangePassword && <div className="t-small t-muted">Pendiente de cambiar la contraseña</div>}
                </td>
                <td className="break-all">{u.email}</td>
                <td>{ROLE[u.role]}</td>
                <td>{u.gmailConnected ? u.gmailUser : <span className="t-muted">No conectado</span>}</td>
                <td className="whitespace-nowrap">{fmt(u.lastLoginAt)}</td>
                <td><span className={`badge ${u.active ? "nueva" : "cerrada"}`}>{u.active ? "Activa" : "Desactivada"}</span></td>
                <td>
                  <div className="flex gap-2 flex-wrap">
                    <button type="button" className="btn btn-secondary btn-sm" disabled={busy === u.id || (u.id === selfId && u.active)} onClick={() => void toggle(u)}>
                      {u.active ? "Desactivar" : "Activar"}
                    </button>
                    <button type="button" className="btn btn-secondary btn-sm" disabled={busy === u.id} onClick={() => reset(u)}>
                      Restablecer contraseña
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
