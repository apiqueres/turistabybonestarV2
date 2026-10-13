import type { Metadata } from "next";
import { LegalPage } from "@/components/layout/LegalPage";

export const metadata: Metadata = { title: "Política de cookies — TuristaByBonestar" };

export default function Cookies() {
  return (
    <LegalPage title="Política de cookies">
      <p>
        Esta web no utiliza cookies de seguimiento, publicidad ni analítica, ni carga servicios de terceros que las instalen.
        Lo único que guarda en tu navegador es almacenamiento local técnico, necesario para que la web funcione como esperas.
      </p>

      <h2 className="t-h3 mt-6">Qué guardamos en tu navegador</h2>
      <ul className="flex flex-col gap-2">
        <li>
          <strong>Tu elección sobre cookies</strong>: para no volver a mostrarte el aviso.
        </li>
        <li>
          <strong>Destinos marcados y respuestas del formulario</strong>: para que no los pierdas si recargas la página o
          vuelves más tarde, hasta que envías la solicitud.
        </li>
        <li>
          <strong>Preferencias de navegación</strong>: si cerraste el aviso de oferta de la portada y si ya viste la animación
          de entrada, para no repetirlos en cada visita.
        </li>
      </ul>
      <p>
        Estos datos se quedan en tu dispositivo, no se envían a ningún servidor y no sirven para identificarte. Puedes borrarlos
        en cualquier momento desde la configuración de tu navegador (datos de sitios web).
      </p>

      <h2 className="t-h3 mt-6">Panel de gestión</h2>
      <p>
        El área privada que usa el equipo de la agencia emplea una cookie de sesión técnica para mantener la identificación de
        cada gestor. No afecta a las personas que visitan la web.
      </p>

      <h2 className="t-h3 mt-6">Si esto cambia</h2>
      <p>
        Si en el futuro incorporamos analítica u otros servicios que usen cookies, actualizaremos esta página y te pediremos
        consentimiento antes de activarlos. El aviso de la web te permite elegir entre aceptar todo o solo lo necesario.
      </p>
    </LegalPage>
  );
}
