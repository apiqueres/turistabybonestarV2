import type { ContactoInput, SolicitudInput } from "@/lib/validation";

/** Estado de una solicitud tal y como lo usa el admin (con guion); en la BD es `en_curso`. */
export type RequestStatus = "nueva" | "en-curso" | "cerrada";

export interface MessageEntry {
  id: string;
  createdAt: string;
  to: string;
  subject: string;
  kind: string;
  status: string;
  error?: string | null;
}

/** Una solicitud del asistente «Cómo viajas» guardada (misma forma que los JSON antiguos + estado). */
export interface StoredRequest {
  id: string;
  createdAt: string;
  data: SolicitudInput;
  status: RequestStatus;
  notes?: string;
  /** Brief .txt generado en el servidor (solo con base de datos). */
  prompt?: string;
  /** Correos enviados desde el servidor (solo con base de datos). */
  messages?: MessageEntry[];
}

/** Un mensaje del formulario corto de contacto. */
export interface StoredContact {
  id: string;
  createdAt: string;
  data: ContactoInput;
  handled: boolean;
}

export interface Page<T> {
  rows: T[];
  total: number;
  page: number;
  pageSize: number;
}
