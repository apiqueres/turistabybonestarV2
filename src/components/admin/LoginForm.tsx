"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { Brand } from "@/components/layout/Brand";
import { STATIC_DEMO } from "@/lib/config";
import { DEMO_CREDENTIALS, demoLogin, useDemoSession } from "@/lib/admin/auth";
import { ArrowRight } from "@/components/ui/icons";

const safeNext = (n: string | null) => (n && n.startsWith("/admin") && !n.startsWith("/admin/login") ? n : "/admin/solicitudes");

/** Acceso al panel: Auth.js (usuario y contraseña de la base de datos) o, en la demo estática, credenciales de muestra. */
export function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const next = safeNext(params.get("next"));
  const [demoSession, hydrated] = useDemoSession();
  const [user, setUser] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (STATIC_DEMO && hydrated && demoSession) router.replace("/admin/solicitudes");
  }, [hydrated, demoSession, router]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (STATIC_DEMO) {
      if (demoLogin(user, password)) router.replace("/admin/solicitudes");
      else setError("Usuario o contraseña incorrectos.");
      return;
    }
    setBusy(true);
    try {
      const res = await signIn("credentials", { email: user, password, redirect: false });
      if (res?.error) setError("Correo o contraseña incorrectos.");
      else {
        router.replace(next);
        router.refresh();
      }
    } catch {
      setError("No se pudo iniciar sesión. Inténtalo de nuevo.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="login">
      <form onSubmit={submit} className="card card-pad w-full max-w-[420px] flex flex-col gap-6">
        <Brand href="/" />
        <div>
          <div className="kicker">Administración</div>
          <h1 className="t-h3 mt-2">Acceso</h1>
        </div>
        <div className="field">
          <label htmlFor="adm-user">{STATIC_DEMO ? "Usuario" : "Correo electrónico"}</label>
          <input id="adm-user" type={STATIC_DEMO ? "text" : "email"} autoComplete={STATIC_DEMO ? "username" : "email"} value={user} onChange={(e) => setUser(e.target.value)} placeholder={STATIC_DEMO ? "admin" : "tu@correo.com"} />
        </div>
        <div className="field">
          <label htmlFor="adm-pass">Contraseña</label>
          <input id="adm-pass" type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" />
          {error && <span className="field-error">{error}</span>}
        </div>
        <button type="submit" className="btn btn-primary btn-sm self-start" disabled={busy}>
          Entrar
          <ArrowRight className="btn-icon" />
        </button>
        {STATIC_DEMO && (
          <div className="t-small t-muted">
            Demostración sin base de datos. Credenciales de prueba: <strong style={{ color: "var(--ink)" }}>{DEMO_CREDENTIALS.user}</strong> /{" "}
            <strong style={{ color: "var(--ink)" }}>{DEMO_CREDENTIALS.password}</strong>
          </div>
        )}
      </form>
    </div>
  );
}
