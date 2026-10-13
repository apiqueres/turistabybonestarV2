import type { Metadata } from "next";
import { LegalPage } from "@/components/layout/LegalPage";

export const metadata: Metadata = { title: "Política de privacidad — TuristaByBonestar" };

export default function Privacidad() {
  return (
    <LegalPage title="Política de privacidad">
      <p>
        Esta política explica qué datos personales recogemos en turistabybonestar.com, para qué los usamos y qué derechos
        tienes, conforme al Reglamento (UE) 2016/679 (RGPD) y la Ley Orgánica 3/2018 (LOPDGDD).
      </p>

      <h2 className="t-h3 mt-6">Responsable del tratamiento</h2>
      <ul className="flex flex-col gap-1">
        <li>CAMELOTSUECA, S.L. (TuristaByBonestar), CIF B98788169.</li>
        <li>Passeig de l&apos;Estació 11, 46410 Sueca (Valencia).</li>
        <li>contacto@turistabybonestar.com · +34 623 375 998.</li>
      </ul>

      <h2 className="t-h3 mt-6">Qué datos recogemos</h2>
      <p>Solo los que nos das tú a través de la web:</p>
      <ul className="flex flex-col gap-2">
        <li>
          <strong>Solicitud de viaje</strong> («¿Dónde nos vamos?»): destinos elegidos, fechas, número de adultos y niños,
          presupuesto aproximado, tipo de pensión, extras, estilo de viaje, nombre y apellidos, correo electrónico, teléfono y
          canal de contacto preferido.
        </li>
        <li>
          <strong>Formulario de contacto</strong>: nombre, correo electrónico, teléfono (opcional) y el mensaje que escribes.
        </li>
        <li>
          <strong>Correos posteriores</strong>: lo que nos cuentes al responder a nuestras propuestas.
        </li>
      </ul>
      <p>
        La web no usa cookies de seguimiento ni herramientas de analítica. La dirección IP se utiliza únicamente, de forma
        temporal y en memoria, para limitar envíos abusivos de formularios; no se guarda asociada a tu solicitud.
      </p>

      <h2 className="t-h3 mt-6">Para qué y con qué base legal</h2>
      <ul className="flex flex-col gap-2">
        <li>
          <strong>Preparar y enviarte una propuesta de viaje</strong>, y contactarte por correo, teléfono o WhatsApp para
          concretarla. Base: medidas precontractuales a petición tuya (art. 6.1.b RGPD) y el consentimiento que das al marcar la
          casilla del formulario (art. 6.1.a).
        </li>
        <li>
          <strong>Responder a tus consultas</strong> enviadas por el formulario de contacto. Base: consentimiento (art. 6.1.a).
        </li>
        <li>
          <strong>Gestionar el viaje contratado</strong>, si finalmente lo reservas con nosotros. Base: ejecución del contrato
          (art. 6.1.b) y obligaciones legales de la agencia (art. 6.1.c).
        </li>
      </ul>
      <p>
        No te enviaremos comunicaciones comerciales que no hayas pedido. La comunidad de WhatsApp es de acceso voluntario a
        través del enlace de la web y se rige por las condiciones de WhatsApp.
      </p>

      <h2 className="t-h3 mt-6">Quién puede acceder a tus datos</h2>
      <ul className="flex flex-col gap-2">
        <li>El equipo de TuristaByBonestar: cada solicitud la atiende un gestor asignado.</li>
        <li>
          <strong>Google LLC</strong> (Gmail): los correos que te enviamos y recibimos pasan por las cuentas de Gmail de la
          agencia y de sus gestores, con las garantías del Marco de Privacidad de Datos UE-EE. UU. al que Google está adherido.
        </li>
        <li>
          <strong>Hetzner Online GmbH</strong> (Alemania): la web y su base de datos se alojan en su centro de datos de
          Núremberg, dentro de la Unión Europea, como encargado del tratamiento.
        </li>
        <li>
          <strong>OpenStreetMap Foundation</strong> (Nominatim): al buscar un lugar en el mapa, el texto que escribes y tu
          dirección IP se envían a su servicio de búsqueda para localizarlo. No le enviamos ningún otro dato.
        </li>
        <li>
          <strong>Proveedores del viaje</strong> (mayoristas, aerolíneas, hoteles, aseguradoras), solo si reservas con nosotros
          y en la medida necesaria para la reserva. Algunos pueden estar fuera del Espacio Económico Europeo según el destino.
        </li>
      </ul>
      <p>No vendemos ni cedemos tus datos a terceros con fines publicitarios.</p>

      <h2 className="t-h3 mt-6">Cuánto tiempo los guardamos</h2>
      <ul className="flex flex-col gap-2">
        <li>
          Solicitudes de viaje: mientras esté abierta y hasta 24 meses después de cerrarse; pasado ese plazo se anonimizan
          (se borran nombre, correo y teléfono).
        </li>
        <li>Mensajes del formulario de contacto: hasta 12 meses desde la respuesta.</li>
        <li>
          Si contratas un viaje, la documentación se conserva los plazos que exigen la normativa fiscal y de viajes combinados
          (en general, cinco años).
        </li>
      </ul>

      <h2 className="t-h3 mt-6">Tus derechos</h2>
      <p>
        Puedes pedirnos acceso a tus datos, rectificarlos, suprimirlos, limitar u oponerte a su tratamiento, solicitar su
        portabilidad y retirar el consentimiento en cualquier momento, escribiendo a contacto@turistabybonestar.com con el
        asunto «Protección de datos» e indicando tu nombre y el correo con el que nos escribiste. Responderemos en el plazo de
        un mes. Si consideras que no hemos atendido tu solicitud correctamente, puedes reclamar ante la Agencia Española de
        Protección de Datos (www.aepd.es).
      </p>

      <h2 className="t-h3 mt-6">Seguridad</h2>
      <p>
        La web funciona bajo HTTPS, los datos se guardan en una base de datos de acceso restringido y las credenciales de
        correo de los gestores se almacenan cifradas. El acceso al panel de gestión requiere usuario y contraseña individuales.
      </p>

      <h2 className="t-h3 mt-6">Menores</h2>
      <p>
        Los formularios están dirigidos a personas mayores de 18 años. Los datos de menores que viajen (número de niños) se
        recogen únicamente para preparar la propuesta y los facilita la persona adulta responsable.
      </p>

      <p className="t-small t-muted">Última actualización: 13 de octubre de 2026.</p>
    </LegalPage>
  );
}
