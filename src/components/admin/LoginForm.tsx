"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Brand } from "@/components/layout/Brand";
import { DEMO_CREDENTIALS, login, useSession } from "@/lib/admin/auth";
import { ArrowRight } from "@/components/ui/icons";

export function LoginForm() {
  const router = useRouter();
  const [session, hydrated] = useSession();
  const [user, setUser] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (hydrated && session) router.replace("/admin/solicitudes");
  }, [hydrated, session, router]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (login(user, password)) {
      router.replace("/admin/solicitudes");
    } else {
      setError("Usuario o contraseña incorrectos.");
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
          <label htmlFor="adm-user">Usuario</label>
          <input id="adm-user" autoComplete="username" value={user} onChange={(e) => setUser(e.target.value)} placeholder="admin" />
        </div>
        <div className="field">
          <label htmlFor="adm-pass">Contraseña</label>
          <input id="adm-pass" type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" />
          {error && <span className="field-error">{error}</span>}
        </div>
        <button type="submit" className="btn btn-primary btn-sm self-start">
          Entrar
          <ArrowRight className="btn-icon" />
        </button>
        <div className="t-small t-muted">
          Demostración sin base de datos. Credenciales de prueba: <strong style={{ color: "var(--ink)" }}>{DEMO_CREDENTIALS.user}</strong> /{" "}
          <strong style={{ color: "var(--ink)" }}>{DEMO_CREDENTIALS.password}</strong>
        </div>
      </form>
    </div>
  );
}
