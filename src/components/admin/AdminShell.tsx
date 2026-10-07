"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useDemoSession } from "@/lib/admin/auth";
import { AdminNav } from "./AdminNav";

/** Armazón del admin en la DEMO estática: puerta en el navegador (localStorage) + barra lateral. */
export function DemoAdminShell({ children }: { children: React.ReactNode }) {
  const [session, hydrated] = useDemoSession();
  const router = useRouter();

  useEffect(() => {
    if (hydrated && !session) router.replace("/admin/login");
  }, [hydrated, session, router]);

  if (!hydrated || !session) return <div className="login" />;

  return (
    <div className="admin">
      <AdminNav userLabel={session.user} note="Demo sin base de datos: los cambios se guardan en este navegador." hide={["/admin/contactos", "/admin/textos", "/admin/cuenta"]} />
      <main className="admin-main">{children}</main>
    </div>
  );
}

/** Armazón del admin con servidor: la sesión ya se comprobó en el layout. */
export function AdminShell({ userLabel, children }: { userLabel: string; children: React.ReactNode }) {
  return (
    <div className="admin">
      <AdminNav userLabel={userLabel} />
      <main className="admin-main">{children}</main>
    </div>
  );
}
