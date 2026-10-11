"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import { Brand } from "@/components/layout/Brand";
import { STATIC_DEMO } from "@/lib/config";
import { demoLogout } from "@/lib/admin/auth";

type Role = "admin" | "gestor";

/** Secciones del panel y quién las ve. El gestor solo tiene Solicitudes y «Mi cuenta». */
export const ADMIN_NAV: { href: string; label: string; roles: Role[] }[] = [
  { href: "/admin/solicitudes", label: "Solicitudes", roles: ["admin", "gestor"] },
  { href: "/admin/contactos", label: "Contactos", roles: ["admin"] },
  { href: "/admin/destinos", label: "Destinos", roles: ["admin"] },
  { href: "/admin/ofertas", label: "Ofertas", roles: ["admin"] },
  { href: "/admin/preguntas", label: "Preguntas", roles: ["admin"] },
  { href: "/admin/textos", label: "Textos", roles: ["admin"] },
  { href: "/admin/usuarios", label: "Usuarios", roles: ["admin"] },
  { href: "/admin/cuenta", label: "Mi cuenta", roles: ["admin", "gestor"] },
];

interface Props {
  userLabel: string;
  /** Rol de la sesión; sin dato se muestra todo el menú (solo lo usa la demo). */
  role?: Role;
  note?: string;
  /** Secciones que no existen en la demo estática. */
  hide?: string[];
}

/** Barra lateral del panel: marca, navegación por rol y cierre de sesión. */
export function AdminNav({ userLabel, role = "admin", note, hide = [] }: Props) {
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
        {ADMIN_NAV.filter((n) => n.roles.includes(role) && !hide.includes(n.href)).map((n) => (
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
