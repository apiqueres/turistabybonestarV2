"use client";

import { useEffect } from "react";
import Link from "next/link";
import { usePersistedState } from "@/lib/storage";

/** Elección guardada: "all" o "necessary". Cuando se añada analítica, consultar esta clave antes de cargarla. */
const KEY = "tb:cookies";
type Choice = "all" | "necessary";

/** Aviso de cookies en todas las rutas. Hasta hidratar no se pinta, para no parpadear si ya eligieron. */
export function CookieBanner() {
  const [choice, setChoice, hydrated] = usePersistedState<Choice | null>(KEY, null);
  const open = hydrated && choice === null;

  // En móvil el botón de WhatsApp se oculta mientras el aviso está abierto (ver .wa en globals.css).
  useEffect(() => {
    document.documentElement.classList.toggle("has-cookie-banner", open);
    return () => document.documentElement.classList.remove("has-cookie-banner");
  }, [open]);

  if (!open) return null;

  return (
    <div className="cookie" role="dialog" aria-label="Aviso de cookies">
      <div className="cookie-title">Cookies</div>
      <p className="cookie-text">
        Usamos almacenamiento local para recordar tus destinos y el formulario. Sin rastreo de terceros.{" "}
        <Link href="/cookies">Política de cookies</Link>
      </p>
      <div className="cookie-actions">
        <button type="button" className="btn btn-primary btn-sm" onClick={() => setChoice("all")}>
          Aceptar
        </button>
        <button type="button" className="btn btn-secondary btn-sm" onClick={() => setChoice("necessary")}>
          Solo necesarias
        </button>
      </div>
    </div>
  );
}
