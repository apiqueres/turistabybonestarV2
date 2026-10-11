"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/admin/api";

interface Settings {
  corporate: string;
  gmailUser: string | null;
  gmailConnected: boolean;
  bccSelf: boolean;
}

/**
 * «Conectar Gmail» de Mi cuenta. La contraseña de aplicación es solo de escritura: el servidor la cifra,
 * la guarda y nunca la devuelve. Antes de guardar, envía una prueba a ese Gmail.
 */
export function MailSettingsForm() {
  const router = useRouter();
  const [settings, setSettings] = useState<Settings | null>(null);
  const [gmail, setGmail] = useState("");
  const [appPassword, setAppPassword] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api<Settings>("/api/admin/cuenta/correo")
      .then((s) => setSettings(s))
      .catch((err) => setStatus(err instanceof Error ? err.message : "No se pudo cargar el correo."));
  }, []);

  const act = async (fn: () => Promise<Settings>, ok: string) => {
    setBusy(true);
    try {
      setSettings(await fn());
      setStatus(ok);
      router.refresh();
    } catch (err) {
      setStatus(err instanceof Error ? err.message : "No se pudo guardar.");
    } finally {
      setBusy(false);
    }
  };

  const connect = (e: React.FormEvent) => {
    e.preventDefault();
    void act(async () => {
      const s = await api<Settings>("/api/admin/cuenta/correo", { method: "POST", body: { gmailUser: gmail, appPassword } });
      setAppPassword("");
      setGmail("");
      return s;
    }, "Gmail conectado. Se ha enviado un correo de prueba a esa cuenta.");
  };

  const disconnect = () => {
    if (!window.confirm("¿Desconectar tu Gmail? Los siguientes correos saldrán con la cuenta de la agencia.")) return;
    void act(() => api<Settings>("/api/admin/cuenta/correo", { method: "DELETE" }), "Gmail desconectado.");
  };

  const toggleBcc = (checked: boolean) => {
    void act(() => api<Settings>("/api/admin/cuenta/correo", { method: "PATCH", body: { bccSelf: checked } }), "Preferencia guardada.");
  };

  if (!settings) return <p className="t-small t-muted">{status ?? "Cargando…"}</p>;

  return (
    <div className="card card-pad flex flex-col gap-5">
      <div>
        <span className="lbl">Tu dirección en el panel</span>
        <div className="t-body break-all">{settings.corporate}</div>
      </div>

      {settings.gmailConnected ? (
        <div className="flex flex-col gap-3">
          <div className="t-body">
            Enviando desde <strong>{settings.gmailUser}</strong> con tu dirección <strong>{settings.corporate}</strong> como remitente y respuesta.
          </div>
          <label className="check">
            <input type="checkbox" checked={settings.bccSelf} disabled={busy} onChange={(e) => toggleBcc(e.target.checked)} />
            <span>Enviarme una copia oculta de cada correo que mande</span>
          </label>
          <div>
            <button type="button" className="btn btn-secondary btn-sm" disabled={busy} onClick={disconnect}>
              Desconectar Gmail
            </button>
          </div>
        </div>
      ) : (
        <form className="flex flex-col gap-4" onSubmit={connect}>
          <p className="t-small t-muted">
            Sin Gmail conectado, tus correos salen con la cuenta de la agencia y respondes a tu dirección corporativa. Para enviar con tu dirección: crea una{" "}
            <strong>contraseña de aplicación</strong> en myaccount.google.com/apppasswords (requiere verificación en dos pasos) y, en Gmail, añade{" "}
            <strong>{settings.corporate}</strong> en Configuración → Cuentas → «Enviar como».
          </p>
          <div>
            <label className="lbl" htmlFor="gm-user">Tu Gmail</label>
            <input id="gm-user" type="email" className="input" autoComplete="off" value={gmail} onChange={(e) => setGmail(e.target.value)} required />
          </div>
          <div>
            <label className="lbl" htmlFor="gm-pass">Contraseña de aplicación (16 caracteres)</label>
            <input id="gm-pass" type="password" className="input" autoComplete="new-password" value={appPassword} onChange={(e) => setAppPassword(e.target.value)} required />
          </div>
          <div>
            <button type="submit" className="btn btn-primary btn-sm" disabled={busy}>
              {busy ? "Probando…" : "Conectar Gmail"}
            </button>
          </div>
        </form>
      )}
      {status && <span className="form-status">{status}</span>}
    </div>
  );
}
