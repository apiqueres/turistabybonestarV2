"use client";

import { useState } from "react";
import { passwordChangeSchema } from "@/lib/validation-admin";
import { ArrowRight } from "@/components/ui/icons";

/** Cambio de contraseña del administrador. */
export function PasswordForm({ email }: { email: string }) {
  const [f, setF] = useState({ current: "", next: "", confirm: "" });
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = passwordChangeSchema.safeParse(f);
    if (!parsed.success) return setMsg(parsed.error.issues[0]?.message ?? "Revisa los campos.");
    setBusy(true);
    setMsg(null);
    try {
      const res = await fetch("/api/admin/cuenta", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(parsed.data) });
      const json = (await res.json()) as { ok: boolean; error?: string };
      if (!json.ok) throw new Error(json.error ?? "No se pudo cambiar la contraseña.");
      setF({ current: "", next: "", confirm: "" });
      setMsg("Contraseña cambiada.");
    } catch (err) {
      setMsg(err instanceof Error ? err.message : "No se pudo cambiar la contraseña.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} className="card card-pad flex flex-col gap-4 max-w-[480px]">
      <div>
        <span className="lbl">Usuario</span>
        <div className="t-small">{email}</div>
      </div>
      <div>
        <label className="lbl" htmlFor="pw-cur">Contraseña actual</label>
        <input id="pw-cur" className="input" type="password" autoComplete="current-password" value={f.current} onChange={(e) => setF({ ...f, current: e.target.value })} />
      </div>
      <div>
        <label className="lbl" htmlFor="pw-new">Nueva contraseña (mínimo 10 caracteres)</label>
        <input id="pw-new" className="input" type="password" autoComplete="new-password" value={f.next} onChange={(e) => setF({ ...f, next: e.target.value })} />
      </div>
      <div>
        <label className="lbl" htmlFor="pw-conf">Repite la nueva contraseña</label>
        <input id="pw-conf" className="input" type="password" autoComplete="new-password" value={f.confirm} onChange={(e) => setF({ ...f, confirm: e.target.value })} />
      </div>
      <div className="flex flex-wrap gap-3 items-center">
        <button type="submit" className="btn btn-primary btn-sm" disabled={busy}>
          Cambiar contraseña
          <ArrowRight className="btn-icon" />
        </button>
        {msg && <span className="form-status">{msg}</span>}
      </div>
    </form>
  );
}
