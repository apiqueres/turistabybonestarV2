import type { FormContent } from "@/types/form";

/** Two pages: the trip (destinations + six questions) and how to reach the client. */
export const formContent: FormContent = {
  header: { stepLabel: "Paso", exit: "Salir" },
  nav: {
    back: "← Atrás",
    backToMap: "← Volver al mapa",
    next: "Siguiente",
    enterHint: "",
    missing: "Faltan los campos con *",
    missingDestination: "Marca al menos un destino para seguir",
    submit: "Enviar mi solicitud",
  },
  summary: { title: "Tu viaje", empty: "Sin respuesta" },
  success: {
    kicker: "Recibido",
    title: ["Ya lo tenemos.", "Ahora nos toca a nosotros."],
    text: "Un gestor revisa tus respuestas y te llama o te escribe con la primera propuesta en 48 horas laborables. Tú solo tendrás que decir que sí.",
    reference: "Referencia",
    home: { label: "Volver al inicio", href: "/" },
    map: { label: "Volver al mapa", href: "/donde-nos-vamos" },
  },
  error: "No hemos podido guardar tu solicitud. Inténtalo de nuevo o escríbenos por WhatsApp.",
  steps: [
    {
      id: "viaje",
      kicker: "01 — Tu viaje",
      title: ["Lo básico", "y nada más."],
      text: "Unas pocas preguntas y, en la siguiente página, tus datos. Lo que no nos digas lo decidimos nosotros y te lo explicamos en la propuesta.",
      hint: "Dos minutos · destino, correo y teléfono obligatorios",
      questions: [
        { id: "destinos", kind: "destinations" },
        { id: "salida", kind: "date", label: "Fecha de salida" },
        { id: "vuelta", kind: "date", label: "Fecha de vuelta" },
        { id: "adultos", kind: "number", label: "Adultos", min: 1, max: 20 },
        { id: "ninos", kind: "number", label: "Niños", min: 0, max: 20 },
        {
          id: "presupuesto",
          kind: "single",
          label: "Presupuesto total del viaje",
          layout: "chips",
          options: [
            { id: "hasta-2000", label: "Hasta 2.000 €" },
            { id: "2000-4000", label: "2.000–4.000 €" },
            { id: "4000-7000", label: "4.000–7.000 €" },
            { id: "7000-12000", label: "7.000–12.000 €" },
            { id: "mas-12000", label: "Más de 12.000 €" },
          ],
        },
        {
          id: "pension",
          kind: "single",
          label: "Tipo de pensión",
          layout: "chips",
          options: [
            { id: "completa", label: "Pensión completa" },
            { id: "media", label: "Media pensión" },
            { id: "sin", label: "Sin pensión" },
          ],
        },
        {
          id: "extras",
          kind: "multi",
          label: "Incluir en el viaje",
          layout: "chips",
          options: [
            { id: "maletas", label: "Maletas de embarque" },
            { id: "traslados", label: "Traslados" },
          ],
        },
        {
          id: "estilo",
          kind: "multi",
          label: "Estilo de viaje (hasta 2)",
          max: 2,
          layout: "cards",
          options: [
            { id: "relax", label: "Relax", text: "Un sitio bueno, poca agenda y tiempo para no hacer nada." },
            { id: "aventurero", label: "Aventurero", text: "Rutas, naturaleza y días que empiezan pronto." },
            { id: "cultural", label: "Cultural", text: "Ciudades, historia, museos y alguien que sepa contarlo." },
            { id: "familiar", label: "En familia", text: "Distancias cortas y planes que aguanten el día con niños." },
            { id: "romantico", label: "Romántico", text: "Para dos. Menos paradas y mejores sitios." },
            { id: "playa", label: "Playa", text: "Mar, sol y un buen hotel para desconectar del todo." },
          ],
        },
      ],
    },
    {
      id: "contacto",
      kicker: "02 — Tus datos",
      title: ["¿A quién le", "contestamos?"],
      text: "Lo último. Un gestor te llama o te escribe con la primera propuesta en 48 horas laborables; no te metemos en ninguna lista de correo.",
      hint: "Nombre, correo y teléfono, obligatorios",
      questions: [
        { id: "nombre", kind: "text", label: "Nombre y apellidos", required: true },
        { id: "email", kind: "text", label: "Correo electrónico", inputType: "email", required: true },
        { id: "telefono", kind: "text", label: "Teléfono", inputType: "tel", required: true },
        {
          id: "privacidad",
          kind: "toggle",
          label: "He leído y acepto los términos y condiciones y la política de privacidad, y autorizo a la agencia a contactarme por teléfono",
          required: true,
        },
      ],
    },
  ],
};
