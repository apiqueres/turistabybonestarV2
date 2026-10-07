import type { RequestStatus, StoredRequest } from "@/types/admin";

export type { RequestStatus, StoredRequest };

/** Sample requests for the admin DEMO (GitHub Pages). On the VPS the panel reads the database. */
export const mockSolicitudes: StoredRequest[] = [
  {
    id: "2026-09-30T09-12-40-120Z_a1b2c3d4",
    createdAt: "2026-09-30T09:12:40.120Z",
    status: "nueva",
    data: {
      destinos: [{ id: "392", nombre: "Japón" }],
      respuestas: { salida: "2027-04-02", vuelta: "2027-04-16", adultos: 2, ninos: 0, presupuesto: "7000-12000", pension: "media", extras: ["maletas", "traslados"], estilo: ["cultural", "relax"] },
      contacto: { nombre: "Marta Ruiz", email: "marta.ruiz@example.com", telefono: "+34 600 111 222", canal: "", privacidad: true },
    },
  },
  {
    id: "2026-10-01T18-40-05-003Z_e5f6a7b8",
    createdAt: "2026-10-01T18:40:05.003Z",
    status: "en-curso",
    notes: "Llamada hecha el 2/10. Cierran el restaurante la segunda quincena de febrero.",
    data: {
      destinos: [{ id: "604", nombre: "Perú" }, { id: "068", nombre: "Bolivia" }],
      respuestas: { salida: "2027-02-10", vuelta: "2027-02-24", adultos: 2, ninos: 2, presupuesto: "4000-7000", pension: "sin", extras: ["traslados"], estilo: ["aventurero", "familiar"] },
      contacto: { nombre: "Familia Soler", email: "soler@example.com", telefono: "+34 600 222 333", canal: "", privacidad: true },
    },
  },
  {
    id: "2026-10-03T11-05-22-870Z_c9d0e1f2",
    createdAt: "2026-10-03T11:05:22.870Z",
    status: "nueva",
    data: {
      destinos: [{ id: "352", nombre: "Islandia" }],
      respuestas: { salida: "2027-02-12", vuelta: "2027-02-19", adultos: 2, ninos: 0, presupuesto: "mas-12000", pension: "completa", extras: ["maletas"], estilo: ["relax", "romantico"] },
      contacto: { nombre: "Jorge y Ana", email: "jorge.ana@example.com", telefono: "+34 611 222 333", canal: "", privacidad: true },
    },
  },
  {
    id: "2026-10-04T16-22-00-440Z_a3b4c5d6",
    createdAt: "2026-10-04T16:22:00.440Z",
    status: "cerrada",
    notes: "Propuesta enviada y aceptada. Reservas en curso.",
    data: {
      destinos: [{ id: "504", nombre: "Marruecos" }, { id: "620", nombre: "Portugal" }],
      respuestas: { salida: "2026-12-26", vuelta: "2027-01-03", adultos: 2, ninos: 3, presupuesto: "2000-4000", pension: "media", extras: ["maletas", "traslados"], estilo: ["familiar", "playa"] },
      contacto: { nombre: "Carlos Pérez", email: "carlos.perez@example.com", telefono: "+34 622 333 444", canal: "", privacidad: true },
    },
  },
];

/* Extra generated samples so the list pagination can be seen in the demo (10 per page). */
const EXTRA: Array<[string, string, string, { id: string; nombre: string }[], RequestStatus, number]> = [
  ["Lucía Fernández", "lucia.fernandez@example.com", "+34 633 444 555", [{ id: "380", nombre: "Italia" }], "nueva", 5],
  ["Andrés Moreno", "andres.moreno@example.com", "", [{ id: "704", nombre: "Vietnam" }, { id: "764", nombre: "Tailandia" }], "en-curso", 6],
  ["Paula y Nacho", "paula.nacho@example.com", "+34 644 555 666", [{ id: "578", nombre: "Noruega" }], "nueva", 7],
  ["Familia Torres", "torres@example.com", "+34 655 666 777", [{ id: "484", nombre: "México" }], "cerrada", 9],
  ["Elena Gil", "elena.gil@example.com", "", [{ id: "400", nombre: "Jordania" }, { id: "818", nombre: "Egipto" }], "nueva", 10],
  ["Rubén Castro", "ruben.castro@example.com", "+34 666 777 888", [{ id: "516", nombre: "Namibia" }], "en-curso", 12],
  ["Inés Romero", "ines.romero@example.com", "+34 677 888 999", [{ id: "300", nombre: "Grecia" }], "nueva", 13],
  ["Marc y Júlia", "marc.julia@example.com", "", [{ id: "620", nombre: "Portugal" }], "cerrada", 15],
  ["Sofía Navarro", "sofia.navarro@example.com", "+34 688 999 000", [{ id: "392", nombre: "Japón" }, { id: "410", nombre: "Corea del Sur" }], "nueva", 17],
  ["Hugo Blanco", "hugo.blanco@example.com", "+34 699 000 111", [{ id: "352", nombre: "Islandia" }], "en-curso", 19],
];

EXTRA.forEach(([nombre, email, telefono, destinos, status, day], i) => {
  const createdAt = new Date(Date.UTC(2026, 8, day, 9 + i, 15 + i * 3)).toISOString();
  mockSolicitudes.push({
    id: `${createdAt.replace(/[:.]/g, "-")}_${(0x1a2b3c + i * 7919).toString(16)}`,
    createdAt,
    status,
    data: {
      destinos,
      respuestas: {
        salida: `2027-0${1 + (i % 6)}-1${i % 9}`,
        vuelta: `2027-0${1 + (i % 6)}-2${i % 8}`,
        adultos: 2 + (i % 2),
        ninos: i % 3,
        presupuesto: ["hasta-2000", "2000-4000", "4000-7000", "7000-12000", "mas-12000"][i % 5],
        pension: ["completa", "media", "sin"][i % 3],
        extras: i % 2 ? ["maletas", "traslados"] : ["traslados"],
        estilo: [["relax", "playa"], ["aventurero"], ["cultural", "familiar"], ["romantico"]][i % 4],
      },
      contacto: { nombre, email, telefono: telefono || `+34 6${String(10 + i).padStart(2, "0")} 000 ${String(100 + i)}`, canal: "", privacidad: true },
    },
  });
});
