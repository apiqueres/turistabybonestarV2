"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import { Brand } from "@/components/layout/Brand";
import { STATIC_DEMO } from "@/lib/config";
import { demoLogout } from "@/lib/admin/auth";

export const ADMIN_NAV = [
  { href: "/admin/solicitudes", label: "Solicitudes" },
  { href: "/admin/contactos", label: "Contactos" },
  { href: "/admin/destinos", label: "Destinos" },
  { href: "/admin/ofertas", label: "Ofertas" },
  { href: "/admin/preguntas", label: "Preguntas" },
  { href: "/admin/textos", label: "Textos" },
  { href: "/admin/cuenta", label: "Cuenta" },
];

interface Props {
  userLabel: string;
  note?: string;
  /** Secciones que no existen en la demo estática. */
  hide?: string[];
}

/** Barra lateral del panel: marca, navegación y cierre de sesión. */
export function AdminNav({ userLabel, note, hide = [] }: Props) {
  const pathname = usePathname();
  const router = useRouter();
  const logout = async () => {
    if (STATIC_DEMO) {
      demoLogout();
      router.replace("/admin/login");
      return;
    }
    await signOut({ redirect: false });
    router.replace("/admin/login");
    router.refresh();
  };
  return (
    <aside className="admin-side">
      <Brand href="/" />
      <nav className="admin-nav" aria-label="Administración">
        {ADMIN_NAV.filter((n) => !hide.includes(n.href)).map((n) => (
          <Link key={n.href} href={n.href} className={pathname.startsWith(n.href) ? "is-active" : ""}>
            {n.label}
          </Link>
        ))}
      </nav>
      <div className="mt-auto flex flex-col gap-3">
        <div className="kicker">Sesión · {userLabel}</div>
        {note && <div className="t-small t-muted">{note}</div>}
        <button type="button" className="btn btn-secondary btn-sm self-start" onClick={logout}>
          Salir
        </button>
      </div>
    </aside>
  );
}
