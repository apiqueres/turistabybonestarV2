import type { SolicitudInput } from "@/lib/validation";

export type RequestStatus = "nueva" | "en-curso" | "cerrada";

export interface StoredRequest {
  id: string;
  createdAt: string;
  data: SolicitudInput;
  status: RequestStatus;
  notes?: string;
}

/** Sample requests for the admin demo (same shape as data/solicitudes/*.json plus a status). */
export const mockSolicitudes: StoredRequest[] = [
  {
    id: "2026-09-30T09-12-40-120Z_a1b2c3d4",
    createdAt: "2026-09-30T09:12:40.120Z",
    status: "nueva",
    data: {
      destinos: [{ id: "392", nombre: "Japón" }],
      respuestas: {
        estilo: ["gastronomico", "cultural"],
        transporte_prefiere: ["tren", "avion-directo"],
        transporte_evita: ["escalas"],
        ritmo: "dos-tres-bases",
        dias: ["mananas-lentas", "tardes-largas"],
        alojamiento: ["boutique", "local"],
        mesa_busca: ["mercados", "alta", "cenar-tarde"],
        restricciones: ["ninguna"],
        cultura: ["museos", "arquitectura", "fotografia"],
        salida: "2027-04-02",
        vuelta: "2027-04-16",
        viajeros: 2,
        duracion: "10-15",
        presupuesto: "3500-6000",
      },
      contacto: { nombre: "Marta Ruiz", email: "marta.ruiz@example.com", telefono: "+34 600 111 222", canal: "whatsapp", privacidad: true },
    },
  },
  {
    id: "2026-10-01T18-40-05-003Z_e5f6a7b8",
    createdAt: "2026-10-01T18:40:05.003Z",
    status: "en-curso",
    notes: "Llamada hecha el 2/10. Quieren salir desde Valencia.",
    data: {
      destinos: [
        { id: "604", nombre: "Perú" },
        { id: "068", nombre: "Bolivia" },
      ],
      respuestas: {
        estilo: ["aventura", "descubrimiento"],
        transporte_prefiere: ["coche", "publico"],
        transporte_evita: ["noche"],
        ritmo: "cada-dos-dias",
        dias: ["madrugar"],
        alojamiento: ["rural", "local"],
        mesa_busca: ["mercados", "barrio"],
        restricciones: ["vegetariano"],
        alergias: "Frutos secos",
        cultura: ["historia", "naturaleza", "artesania"],
        viajeros: 4,
        fechas_flexibles: true,
        duracion: "10-15",
        presupuesto: "2000-3500",
      },
      contacto: { nombre: "Familia Soler", email: "soler@example.com", telefono: "", canal: "correo", privacidad: true },
    },
  },
  {
    id: "2026-10-03T11-05-22-870Z_c9d0e1f2",
    createdAt: "2026-10-03T11:05:22.870Z",
    status: "nueva",
    data: {
      destinos: [{ id: "352", nombre: "Islandia" }],
      respuestas: {
        estilo: ["descanso", "romantico"],
        transporte_prefiere: ["coche"],
        ritmo: "un-sitio",
        alojamiento: ["lujo", "boutique"],
        mesa_busca: ["alta", "desayunos"],
        restricciones: ["sin-gluten"],
        cultura: ["naturaleza", "fotografia"],
        salida: "2027-02-12",
        vuelta: "2027-02-19",
        viajeros: 2,
        duracion: "semana",
        presupuesto: "sin-techo",
      },
      contacto: { nombre: "Jorge y Ana", email: "jorge.ana@example.com", telefono: "+34 611 222 333", canal: "telefono", privacidad: true },
    },
  },
  {
    id: "2026-10-04T16-22-00-440Z_a3b4c5d6",
    createdAt: "2026-10-04T16:22:00.440Z",
    status: "cerrada",
    notes: "Propuesta enviada y aceptada. Reservas en curso.",
    data: {
      destinos: [
        { id: "504", nombre: "Marruecos" },
        { id: "620", nombre: "Portugal" },
      ],
      respuestas: {
        estilo: ["familia", "cultural"],
        transporte_prefiere: ["avion-directo", "traslados"],
        transporte_evita: ["conducir"],
        ritmo: "equilibrado",
        dias: ["mananas-lentas"],
        alojamiento: ["apartamento", "clasico"],
        mesa_busca: ["barrio", "cocinar"],
        restricciones: ["sin-cerdo"],
        cultura: ["artesania", "musica"],
        salida: "2026-12-26",
        vuelta: "2027-01-03",
        viajeros: 5,
        duracion: "semana",
        presupuesto: "1000-2000",
      },
      contacto: { nombre: "Carlos Pérez", email: "carlos.perez@example.com", telefono: "+34 622 333 444", canal: "igual", privacidad: true },
    },
  },
];
