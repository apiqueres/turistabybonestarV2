import type { Metadata } from "next";
import { LegalPage } from "@/components/layout/LegalPage";

export const metadata: Metadata = { title: "Aviso legal — TuristaByBonestar" };

/* Los datos entre corchetes están pendientes de confirmar con la agencia. */
export default function AvisoLegal() {
  return (
    <LegalPage title="Aviso legal">
      <p>
        En cumplimiento de la Ley 34/2002, de 11 de julio, de Servicios de la Sociedad de la Información y de Comercio
        Electrónico (LSSI-CE), se informa de que el sitio web turistabybonestar.com (en adelante, «la web») es titularidad de:
      </p>
      <ul className="flex flex-col gap-1">
        <li>Titular: [RAZÓN SOCIAL O NOMBRE Y APELLIDOS], que opera bajo el nombre comercial TuristaByBonestar.</li>
        <li>NIF: [NIF/CIF].</li>
        <li>Domicilio: Passeig de l&apos;Estació 11, 46410 Sueca (Valencia) [confirmar si es el domicilio social].</li>
        <li>Correo electrónico: contacto@turistabybonestar.com.</li>
        <li>Teléfono: +34 623 375 998.</li>
        <li>Datos registrales: [Registro Mercantil de Valencia, tomo, folio, hoja] (si procede).</li>
        <li>Título-licencia de agencia de viajes: [CV-Mm-0000-V] (Comunitat Valenciana).</li>
      </ul>

      <h2 className="t-h3 mt-6">Objeto</h2>
      <p>
        La web informa de los servicios de TuristaByBonestar como agencia de viajes y permite solicitar, sin compromiso,
        una propuesta de viaje a medida. La contratación de cualquier viaje se formaliza fuera de la web, con las condiciones
        particulares y la documentación que se entregan en cada caso.
      </p>

      <h2 className="t-h3 mt-6">Condiciones de uso</h2>
      <p>
        El acceso a la web es libre y gratuito. Quien la usa se compromete a hacerlo de forma lícita, a facilitar datos veraces
        en los formularios y a no realizar acciones que puedan dañar, sobrecargar o impedir el funcionamiento normal de la web.
        Los formularios están pensados para personas mayores de 18 años.
      </p>

      <h2 className="t-h3 mt-6">Propiedad intelectual e industrial</h2>
      <p>
        Los textos, imágenes, logotipos, diseño y código de la web pertenecen a su titular o cuentan con autorización de uso.
        No está permitida su reproducción, distribución o transformación sin permiso expreso, salvo para uso personal y privado.
        Las marcas de terceros que puedan aparecer pertenecen a sus respectivos titulares.
      </p>

      <h2 className="t-h3 mt-6">Responsabilidad</h2>
      <p>
        Los precios, fechas y condiciones de las ofertas publicadas son orientativos y están sujetos a disponibilidad en el
        momento de la contratación. El titular no se hace responsable del contenido de sitios de terceros a los que se enlaza
        (por ejemplo, WhatsApp o Instagram) ni de las interrupciones del servicio por causas ajenas a su control.
      </p>

      <h2 className="t-h3 mt-6">Protección de datos y cookies</h2>
      <p>
        El tratamiento de los datos personales se describe en la <a href="/privacidad">política de privacidad</a> y el uso del
        almacenamiento del navegador en la <a href="/cookies">política de cookies</a>.
      </p>

      <h2 className="t-h3 mt-6">Legislación aplicable</h2>
      <p>
        Estas condiciones se rigen por la legislación española. Para cualquier controversia, y cuando la ley lo permita, las
        partes se someten a los juzgados y tribunales de [Sueca / Valencia]. Las personas consumidoras pueden acudir además a la
        plataforma europea de resolución de litigios en línea: https://ec.europa.eu/consumers/odr.
      </p>
    </LegalPage>
  );
}
