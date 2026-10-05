"use client";

import { useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Brand } from "@/components/layout/Brand";
import { logout, useSession } from "@/lib/admin/auth";

const NAV = [
  { href: "/admin/solicitudes", label: "Solicitudes" },
  { href: "/admin/destinos", label: "Destinos" },
  { href: "/admin/preguntas", label: "Preguntas" },
];

/** Gate + sidebar for the admin mock. Redirects to the login when there is no session. */
export function AdminShell({ children }: { children: React.ReactNode }) {
  const [session, hydrated] = useSession();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (hydrated && !session) router.replace("/admin/login");
  }, [hydrated, session, router]);

  if (!hydrated || !session) return <div className="login" />;

  return (
    <div className="admin">
      <aside className="admin-side">
        <Brand href="/" />
        <nav className="admin-nav" aria-label="Administración">
          {NAV.map((n) => (
            <Link key={n.href} href={n.href} className={pathname.startsWith(n.href) ? "is-active" : ""}>
              {n.label}
            </Link>
          ))}
        </nav>
        <div className="mt-auto flex flex-col gap-3">
          <div className="kicker">Sesión · {session.user}</div>
          <div className="t-small t-muted">Demo sin base de datos: los cambios se guardan en este navegador.</div>
          <button
            type="button"
            className="btn btn-secondary btn-sm self-start"
            onClick={() => {
              logout();
              router.replace("/admin/login");
            }}
          >
            Salir
          </button>
        </div>
      </aside>
      <main className="admin-main">{children}</main>
    </div>
  );
}
