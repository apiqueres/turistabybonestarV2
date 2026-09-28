import type { Metadata } from "next";
import { LegalPage } from "@/components/layout/LegalPage";

export const metadata: Metadata = { title: "Política de privacidad — TuristaByBonestar" };

export default function Privacidad() {
  return (
    <LegalPage title="Política de privacidad">
      <p>
        Sustituye este texto por la política de privacidad de TuristaByBonestar: responsable del tratamiento, finalidad,
        base jurídica, conservación, destinatarios y derechos de las personas usuarias.
      </p>
    </LegalPage>
  );
}
