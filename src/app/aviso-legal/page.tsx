import type { Metadata } from "next";
import { LegalPage } from "@/components/layout/LegalPage";

export const metadata: Metadata = { title: "Aviso legal — TuristaByBonestar" };

export default function AvisoLegal() {
  return (
    <LegalPage title="Aviso legal">
      <p>
        Este sitio web es propiedad de TuristaByBonestar. Sustituye este texto por la información legal de la empresa:
        razón social, NIF, domicilio, datos de inscripción registral y licencia de agencia de viajes.
      </p>
    </LegalPage>
  );
}
