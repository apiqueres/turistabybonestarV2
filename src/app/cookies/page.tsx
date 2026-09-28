import type { Metadata } from "next";
import { LegalPage } from "@/components/layout/LegalPage";

export const metadata: Metadata = { title: "Política de cookies" };

export default function Cookies() {
  return (
    <LegalPage title="Política de cookies">
      <p>
        Este sitio solo usa almacenamiento local del navegador para recordar los destinos marcados y las respuestas del
        formulario mientras lo rellenas. Sustituye este texto por la política de cookies definitiva cuando se añadan
        analítica u otros servicios de terceros.
      </p>
    </LegalPage>
  );
}
