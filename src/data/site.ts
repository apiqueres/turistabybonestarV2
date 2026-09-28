import type { SiteContent } from "@/types/content";
import destinations from "./destinations.json";

export const siteContent: SiteContent = {
  brand: {
    name: "TuristaByBonestar",
    tagline: "Gestión de viajes a medida.",
    city: "Sueca, Valencia",
    phone: "+34 961 00 00 00",
    whatsapp: "+34 622 00 00 00",
    email: "hola@turistabybonestar.com",
    hours: "L–V · 10:00–19:00",
    instagram: "https://instagram.com",
    year: 2026,
  },
  nav: {
    links: [
      { label: "Inicio", href: "/", key: "/" },
      { label: "¿Dónde nos vamos?", href: "/donde-nos-vamos", key: "/donde-nos-vamos" },
      { label: "Cómo viajas", href: "/como-viajas", key: "/como-viajas" },
      { label: "Contacto", href: "/contacto", key: "/contacto" },
    ],
    cta: { label: "Empezar", href: "/donde-nos-vamos" },
  },
  home: {
    hero: {
      kicker: "Gestión de viajes a medida · Sueca, Valencia",
      word: "Viaja",
      subtitle: ["Tú eliges el mundo. Nosotros lo ordenamos.", "Sin paquetes cerrados: el viaje entero alrededor de cómo viajas tú."],
      primary: { label: "¿Dónde nos vamos?", href: "/donde-nos-vamos" },
      secondary: { label: "O cuéntanos cómo viajas", href: "/como-viajas" },
      video: { mp4: "/media/hero.mp4", poster: "/media/hero-poster.webp" },
    },
    method: {
      kicker: "El método",
      steps: [
        {
          number: "01",
          title: ["Eliges el destino.", "O no lo eliges."],
          text: "Marca en el mapa los sitios que te tiran: cualquier país vale, aunque de doce nos sabemos hasta los horarios. Con uno basta para empezar.",
        },
        {
          number: "02",
          title: ["Nos cuentas", "cómo viajas."],
          text: "Ocho pantallas, una pregunta en cada una. Estilo, transporte, ritmo, mesa, cultura, fechas y presupuesto. Cinco minutos.",
        },
        {
          number: "03",
          title: ["Recibes el viaje", "ya montado."],
          text: "Un gestor lo construye a mano: ruta, vuelos, alojamientos, reservas y mesa. Tú lo apruebas o lo corriges.",
        },
      ],
    },
    destinations: {
      kicker: "Algunos sitios que nos sabemos",
      title: ["Doce destinos que", "conocemos de memoria."],
      link: { label: "Ver el mapa completo", href: "/donde-nos-vamos" },
    },
    about: {
      kicker: "Sobre nosotros",
      title: ["Un viaje no se elige", "en un catálogo.", "Se escribe contigo."],
      meta: "Desde 2014 · Viajes individuales, parejas, familias y grupos pequeños",
      image: { src: "/media/about.webp", alt: "Viajero contemplando un valle de montaña al amanecer" },
      paragraph:
        "TuristaByBonestar nació en Sueca de una idea sencilla: un viaje bien diseñado se recuerda toda la vida. Cada ruta se construye desde cero, con alojamientos elegidos uno a uno, traslados resueltos y gente local que abre puertas que no aparecen en ninguna guía. Tú decides el ritmo; nosotros nos ocupamos del resto.",
      stats: [
        { value: 60, suffix: "+", label: "Países" },
        { value: 12000, suffix: "+", label: "Viajeros" },
      ],
      partners: ["Aerolíneas del Sur", "Hotelia", "Nomad Cover", "RailEuropa", "GlobalStay"],
    },
    dimensions: {
      kicker: "Lo que preguntamos",
      text: "Diez dimensiones. Solo el destino es obligatorio: lo demás que dejes en blanco, lo decidimos nosotros y te lo justificamos.",
      items: [
        { label: "Ubicaciones", step: 0 },
        { label: "Estilo de viaje", step: 1 },
        { label: "Transporte", step: 2 },
        { label: "Ritmo", step: 3 },
        { label: "Alojamiento", step: 3 },
        { label: "Comida y restricciones", step: 4 },
        { label: "Cultura", step: 5 },
        { label: "Fechas", step: 6 },
        { label: "Presupuesto", step: 6 },
        { label: "Viajeros", step: 6 },
      ],
    },
    table: {
      kicker: "Cómo se come en este viaje",
      statement: ["Para la mitad de nuestros clientes,", "la mesa ordena el itinerario entero."],
      quote:
        "Íbamos a ir doce días a Japón haciendo la ruta de siempre. Nos montaron una que empezaba en Kanazawa y acababa en una isla del mar interior, y no repetimos ni un hotel malo.",
      author: "Carmen y Víctor",
      meta: "Japón · 2025",
    },
    team: {
      title: "Las personas que te acompañan",
      members: [
        {
          id: "laura",
          name: "Laura García",
          role: "Fundadora y diseñadora de viajes",
          bio: "Empezó organizando rutas para amigos y acabó fundando la agencia. Ha diseñado más de cuatrocientos itinerarios y sigue probando cada hotel nuevo antes de recomendarlo.",
          stats: [
            { value: 400, suffix: "+", label: "Rutas diseñadas" },
            { value: 14, label: "Años de experiencia" },
          ],
          image: { src: "/media/team-4.webp", alt: "Retrato de Laura García" },
        },
        {
          id: "javier",
          name: "Javier Martínez",
          role: "Guía de montaña",
          bio: "Guía titulado de alta montaña. Lidera nuestras rutas en Patagonia, Islandia y los Alpes, siempre con un plan B para cada tramo.",
          stats: [
            { value: 120, suffix: "+", label: "Expediciones" },
            { value: 30, suffix: "+", label: "Cumbres guiadas" },
          ],
          image: { src: "/media/team-1.webp", alt: "Retrato de Javier Martínez" },
        },
        {
          id: "pablo",
          name: "Pablo Sánchez",
          role: "Fotógrafo y guía",
          bio: "Acompaña los viajes de Asia y el Mediterráneo con la cámara al hombro. Sus viajeros vuelven con un álbum editado y con las mejores horas de luz marcadas en el mapa.",
          stats: [
            { value: 60, suffix: "+", label: "Viajes guiados" },
            { value: 25, label: "Países fotografiados" },
          ],
          image: { src: "/media/team-2.webp", alt: "Retrato de Pablo Sánchez" },
        },
        {
          id: "maria",
          name: "María López",
          role: "Experta en cultura e historia",
          bio: "Historiadora del arte. Diseña las rutas culturales de Grecia, Marruecos y Japón y consigue accesos a espacios que normalmente están cerrados al público.",
          stats: [
            { value: 90, suffix: "+", label: "Rutas culturales" },
            { value: 18, label: "Años guiando" },
          ],
          image: { src: "/media/team-3.webp", alt: "Retrato de María López" },
        },
      ],
    },
    closing: {
      kicker: "¿Empezamos?",
      title: ["Dinos dónde,", "o dinos cómo."],
      image: { src: "/media/pan-closing.webp", alt: "Dunas del desierto al atardecer con dos viajeros a lo lejos" },
      primary: { label: "Abrir el mapa", href: "/donde-nos-vamos" },
      secondary: { label: "Cuéntanos cómo viajas", href: "/como-viajas" },
    },
  },
  map: {
    kicker: "02 — ¿Dónde nos vamos?",
    title: "¿Dónde nos vamos?",
    text: "Marca los sitios que te tiran. Puedes elegir varios y cambiar de idea luego, pero al menos uno tiene que ser.",
    rule: { label: "Un destino como mínimo", hint: ["Puedes marcar cualquier país.", "Los de cian son los que mejor conocemos."] },
    legend: ["Proyección Equal Earth · cualquier país es válido · 12 recomendados", "Pulsa para marcar · vuelve a pulsar para quitarlo"],
    list: { label: "Tu lista", empty: "Todavía no has marcado nada", cta: "¡Te lo organizamos!", ctaHref: "/como-viajas", needOne: "Marca al menos un país para seguir" },
    recurrent: {
      kicker: "Nuestros más recurrentes",
      title: ["Doce sitios que nos", "piden una y otra vez."],
      text: "No son los únicos, montamos donde haga falta, pero de estos nos sabemos las temporadas, los horarios y a quién hay que llamar. Elige uno para ver su ficha.",
    },
    add: "Añadir a mi lista",
    remove: "Quitar de mi lista",
  },
  contact: {
    kicker: "03 — Contacto",
    title: "Hablemos.",
    text: "Si prefieres contarlo por teléfono en vez de rellenar formularios, también vale. Respondemos en menos de 24 horas laborables.",
    formKicker: "Escríbenos",
    fields: {
      name: "Nombre y apellidos",
      email: "Correo electrónico",
      phone: "Teléfono (opcional)",
      message: "¿En qué estás pensando?",
      messagePlaceholder: "Destino, fechas aproximadas, cuántos sois…",
      privacy: "He leído y acepto la política de privacidad",
      submit: "Enviar",
    },
    success: { title: "Recibido.", text: "Te escribimos en menos de 24 horas laborables." },
    mapNudge: { text: "¿Todavía no sabes dónde? Empieza por el mapa.", cta: { label: "¿Dónde nos vamos?", href: "/donde-nos-vamos" } },
  },
  footer: {
    sections: "Secciones",
    contact: "Contacto",
    legal: "Legal",
    legalLinks: [
      { label: "Aviso legal", href: "/aviso-legal" },
      { label: "Privacidad", href: "/privacidad" },
      { label: "Cookies", href: "/cookies" },
    ],
    credits: { label: "Créditos fotográficos", href: "/creditos" },
  },
  destinations,
};
