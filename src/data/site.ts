import type { SiteContent } from "@/types/content";
import destinations from "./destinations.json";
import ofertas from "./ofertas.json";

export const siteContent: SiteContent = {
  brand: {
    name: "TuristaByBonestar",
    tagline: "Viajes a medida para quien no tiene tiempo de organizarlos.",
    city: "Bonestar's Bistro · Passeig de l'Estació 11, Sueca",
    phone: "+34 623 375 998",
    whatsapp: "+34 623 375 998",
    communityName: "Turista by Bonestar✈️ Comunidad Privada1",
    communityUrl: "https://chat.whatsapp.com/Dyx6BhsB5VUCuxqKqhAK81",
    email: "turistasinlicenciabook@gmail.com",
    hours: "L–V · 10:00–19:00",
    instagram: "https://instagram.com/turistabyb",
    year: 2026,
  },
  nav: {
    links: [
      { label: "Inicio", href: "/", key: "/" },
      { label: "¿Dónde nos vamos?", href: "/donde-nos-vamos", key: "/donde-nos-vamos" },
      { label: "Ofertas", href: "/ofertas", key: "/ofertas", accent: true },
      { label: "Contacto", href: "/contacto", key: "/contacto" },
    ],
    cta: { label: "Empezar", href: "/donde-nos-vamos" },
  },
  home: {
    hero: {
      kicker: "Viajes a medida para hosteleros y empresarios · Sueca, Valencia",
      word: "Desconecta",
      subtitle: ["Llevas años sin parar y tu familia lleva años esperando ese viaje.", "Tú eliges el destino y las fechas; nosotros montamos todo lo demás."],
      primary: { label: "¿Dónde nos vamos?", href: "/donde-nos-vamos" },
      secondary: { label: "Cuéntanos cómo viajas", href: "/como-viajas" },
      video: { mp4: "/media/hero.mp4", poster: "/media/hero-poster.webp" },
    },
    method: {
      kicker: "Así de simple",
      steps: [
        {
          number: "01",
          title: ["Eliges el destino.", "Tú decides dónde."],
          text: "Escribe el país o la ciudad a la que quieres llevar a los tuyos y el mapa te lleva hasta allí. Cualquiera vale, aunque de doce nos sabemos hasta los horarios.",
        },
        {
          number: "02",
          title: ["Nos cuentas", "lo básico."],
          text: "Dos pantallas: fechas, quiénes viajáis, presupuesto, pensión, maletas y traslados y el estilo de viaje; después, tus datos. Dos minutos entre servicio y servicio.",
        },
        {
          number: "03",
          title: ["Nosotros lo montamos.", "Tú sigues con lo tuyo."],
          text: "Un gestor construye el viaje entero y te lo manda listo para aprobar. Sin buscar, sin comparar, sin cien llamadas. Solo tienes que decir que sí.",
        },
      ],
    },
    destinations: {
      kicker: "Para quien no tiene tiempo de buscar",
      title: ["Doce destinos que", "conocemos de memoria."],
      link: { label: "Ver el mapa completo", href: "/donde-nos-vamos" },
    },
    about: {
      kicker: "A quién nos dirigimos",
      title: ["Para quien lleva años", "sin descansar de verdad."],
      meta: "Hosteleros y empresarios · de 30 a 60 años · familias que llevan tiempo esperando",
      image: { src: "/media/about.webp", alt: "Viajero contemplando un valle de montaña al amanecer" },
      paragraph:
        "Diriges tu negocio con el alma. Trabajas los siete días de la semana y te has perdido cumpleaños, comuniones y navidades. El dinero nunca ha sido el problema: el problema es encontrar el momento y, cuando por fin llega, que organizarlo no te agote. Para eso estamos nosotros. Tú eliges el destino y las fechas; el viaje entero, con alojamientos, traslados y reservas, lo montamos nosotros y te lo entregamos listo.",
      stats: [
        { value: 60, suffix: "+", label: "Países" },
        { value: 12000, suffix: "+", label: "Viajeros" },
      ],
      partners: ["Aerolíneas del Sur", "Hotelia", "Nomad Cover", "RailEuropa", "GlobalStay"],
    },
    dimensions: {
      kicker: "Lo que te preguntamos",
      text: "Unas pocas preguntas en dos pantallas: el viaje y tus datos. Lo que no nos digas, lo decidimos nosotros y te lo explicamos en la propuesta.",
      items: [
        { label: "Fechas", step: 0 },
        { label: "Viajeros", step: 0 },
        { label: "Presupuesto", step: 0 },
        { label: "Pensión", step: 0 },
        { label: "Maletas y traslados", step: 0 },
        { label: "Estilo de viaje", step: 0 },
      ],
    },
    pain: {
      kicker: "El dolor real",
      statement: ["No es que no quieras viajar.", "Es que nadie te lo ha puesto fácil."],
      items: [
        "Sientes que el negocio no puede funcionar sin ti.",
        "Te da miedo que tus únicas vacaciones del año sean una decepción.",
        "Has tenido malas experiencias: cosas que salieron mal, tiempo perdido, dinero mal gastado.",
        "Sientes culpa cuando descansas.",
        "No sabes delegar, y eso te paraliza hasta para organizar unas vacaciones.",
      ],
      answer: "Delegar el viaje es la primera vez que delegas algo. Nosotros lo montamos entero, tú solo lo apruebas, y el único trabajo que te queda es cerrar el negocio ese día.",
      quote: "Llevábamos cuatro años prometiendo a los niños el viaje. Nos lo montaron entero mientras yo cerraba la temporada; solo tuve que decir que sí.",
      author: "Carmen y Víctor, restaurante en Sueca",
      meta: "Japón · 2025",
    },
    team: {
      title: "Las personas que te acompañan",
      members: [
        {
          id: "laura",
          name: "Laura García",
          role: "Fundadora y diseñadora de viajes",
          bio: "Hija de hosteleros. Sabe lo que cuesta cerrar un negocio una semana y por eso diseña viajes que no den trabajo: todo resuelto antes de salir y un teléfono al otro lado durante el viaje.",
          stats: [
            { value: 400, suffix: "+", label: "Viajes diseñados" },
            { value: 14, label: "Años de experiencia" },
          ],
          image: { src: "/media/team-4.webp", alt: "Retrato de Laura García" },
        },
        {
          id: "javier",
          name: "Javier Martínez",
          role: "Guía de montaña",
          bio: "Guía titulado de alta montaña. Lidera las rutas de Patagonia, Islandia y los Alpes, siempre con un plan B para cada tramo.",
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
      title: ["Dinos dónde vas.", "Nosotros lo montamos."],
      image: { src: "/media/pan-closing.webp", alt: "Dunas del desierto al atardecer con dos viajeros a lo lejos" },
      primary: { label: "Abrir el mapa", href: "/donde-nos-vamos" },
      secondary: { label: "Cuéntanos cómo viajas", href: "/como-viajas" },
    },
  },
  map: {
    kicker: "02 — ¿Dónde nos vamos?",
    title: "¿Dónde nos vamos?",
    text: "Escribe el país o la ciudad a la que quieres llevar a los tuyos y el mapa te llevará hasta allí. Puedes cambiar de idea las veces que quieras: el último que elijas es el que nos queda.",
    rule: { label: "Un destino", hint: ["Vale cualquier país o ciudad del mundo.", "Los de cian son los que mejor conocemos."] },
    search: { placeholder: "¿A dónde? Un país o una ciudad…", hint: "Escribe y elige una sugerencia · Enter añade la primera" },
    legend: ["Proyección Equal Earth · 12 destinos recomendados en cian", "Escribe un destino arriba para acercar el mapa"],
    list: { label: "Tu destino", empty: "Todavía no has elegido ninguno", cta: "¡Te lo organizamos!", ctaHref: "/como-viajas", needOne: "Elige un destino para seguir" },
    recurrent: {
      kicker: "Nuestros más recurrentes",
      title: ["Doce sitios que nos", "piden una y otra vez."],
      text: "No son los únicos, montamos donde haga falta, pero de estos nos sabemos las temporadas, los horarios y a quién hay que llamar. Elige uno para ver su ficha.",
    },
    add: "Elegir este destino",
    remove: "Quitar este destino",
  },
  contact: {
    kicker: "03 — Contacto",
    title: "Hablemos.",
    text: "Si prefieres contarlo por teléfono entre servicio y servicio, también vale. Respondemos en menos de 24 horas laborables.",
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
    mapNudge: { text: "¿Ya sabes dónde vas? Búscalo en el mapa.", cta: { label: "¿Dónde nos vamos?", href: "/donde-nos-vamos" } },
  },
  offers: {
    kicker: "Ofertas de temporada",
    title: ["Viajes a buen precio", "cuando toca ir."],
    text: "Salidas que preparamos cuando la temporada lo merece: vuelos, hotel, traslados y seguro cerrados a un precio que no se repite. Cambian cada pocas semanas.",
    community: {
      kicker: "Comunidad de WhatsApp",
      title: "Únete a la comunidad y recibe un itinerario gratuito.",
      text: "Las ofertas salen primero en la comunidad privada de WhatsApp. Al entrar te regalamos un itinerario a medida del destino que elijas, sin compromiso.",
      cta: "Unirme a la comunidad",
    },
    empty: "Ahora mismo no hay ofertas activas. Únete a la comunidad para enterarte de la próxima.",
    cta: "Quiero esta oferta",
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
  offersList: ofertas,
};
