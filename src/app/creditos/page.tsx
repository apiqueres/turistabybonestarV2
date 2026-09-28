import type { Metadata } from "next";
import { LegalPage } from "@/components/layout/LegalPage";
import credits from "../../../public/media/credits.json";
import destinations from "@/data/destinations.json";

export const metadata: Metadata = { title: "Créditos fotográficos" };

/** Attribution for the real destination photos (Wikimedia Commons, CC licences). */
export default function Creditos() {
  const entries = Object.entries(credits as Record<string, { title: string; author: string; license: string; source: string }>);
  const nameFor = (file: string) => destinations.find((d) => d.image.src.includes(file))?.name ?? file;
  return (
    <LegalPage title="Créditos fotográficos">
      <p>
        Las fotografías de los destinos son imágenes reales publicadas en Wikimedia Commons bajo licencias libres. Autoría y
        licencia de cada una:
      </p>
      <ul className="flex flex-col gap-3">
        {entries.map(([file, c]) => (
          <li key={file} className="rule-b pb-3">
            <strong style={{ color: "var(--ink)" }}>{nameFor(file)}</strong>
            {" · "}
            <a href={c.source} target="_blank" rel="noreferrer" className="underline">
              {c.title.replace(/^File:/, "")}
            </a>
            {" · "}
            {c.author || "Autor no indicado"} · {c.license}
          </li>
        ))}
      </ul>
      <p>
        El vídeo de portada, la fotografía de la sección «Sobre nosotros», la del cierre y los retratos del equipo son
        imágenes generadas y se usan como material de muestra.
      </p>
    </LegalPage>
  );
}
