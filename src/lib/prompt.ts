import { formContent } from "@/data/form";
import type { SolicitudInput } from "./validation";

export interface SummarySection {
  title: string;
  rows: [string, string][];
}

const CANAL: Record<string, string> = { correo: "Correo electrónico", telefono: "Teléfono", whatsapp: "WhatsApp", igual: "Cualquiera" };

function optionLabel(stepId: string, questionId: string, optionId: string): string {
  const step = formContent.steps.find((s) => s.id === stepId);
  const q = step?.questions.find((qq) => qq.id === questionId);
  if (q && (q.kind === "multi" || q.kind === "single")) return q.options.find((o) => o.id === optionId)?.label ?? optionId;
  return optionId;
}

function formatValue(stepId: string, questionId: string, v: unknown): string {
  if (Array.isArray(v)) return v.map((id) => optionLabel(stepId, questionId, String(id))).join(", ");
  if (typeof v === "boolean") return v ? "Sí" : "No";
  if (typeof v === "string") return /^\d{4}-\d{2}-\d{2}$/.test(v) ? formatDate(v) : optionLabel(stepId, questionId, v);
  return String(v);
}

export function formatDate(iso: string): string {
  const d = new Date(iso.length === 10 ? `${iso}T12:00:00` : iso);
  return d.toLocaleDateString("es-ES", { day: "numeric", month: "short", year: "numeric", timeZone: "Europe/Madrid" });
}

export function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString("es-ES", { dateStyle: "medium", timeStyle: "short", timeZone: "Europe/Madrid" });
}

export function canalLabel(canal?: string): string {
  return CANAL[canal ?? ""] ?? "Cualquiera";
}

/** Answers grouped by wizard step, with labels instead of ids. Shared by the .txt brief and the e-mails. */
const CONTACT_IDS = new Set(["nombre", "email", "telefono", "canal", "privacidad"]);

export function summarize(s: SolicitudInput): SummarySection[] {
  const out: SummarySection[] = [];
  for (const step of formContent.steps) {
    const rows: [string, string][] = [];
    for (const q of step.questions) {
      if (q.kind === "destinations" || CONTACT_IDS.has(q.id)) continue;
      const v = s.respuestas[q.id];
      if (v === undefined || v === "" || (Array.isArray(v) && v.length === 0)) continue;
      const label = ("label" in q && q.label) || "Elección";
      rows.push([label, formatValue(step.id, q.id, v)]);
    }
    if (rows.length) out.push({ title: step.kicker.replace(/^\d+\s—\s/, ""), rows });
  }
  return out;
}

/* ---------- Plain-text brief for the agency (saved as <id>.txt) ---------- */

const WIDTH = 72;
const rule = (ch: string) => ch.repeat(WIDTH);
const wrap = (text: string, indent: number) => {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let line = "";
  for (const w of words) {
    if ((line + " " + w).trim().length > WIDTH - indent) {
      lines.push(line.trim());
      line = w;
    } else line = `${line} ${w}`;
  }
  if (line.trim()) lines.push(line.trim());
  return lines.map((l, i) => (i === 0 ? l : " ".repeat(indent) + l)).join("\n");
};
const kv = (k: string, v: string) => {
  const key = k.length > 22 ? `${k.slice(0, 21)}…` : k;
  return `${key.padEnd(24)}${wrap(v, 24)}`;
};
const section = (title: string, body: string[]) => [title.toUpperCase(), rule("─"), ...body, ""].join("\n");

/** Readable, aligned brief for the team. */
export function buildPrompt(id: string, createdAt: string, s: SolicitudInput): string {
  const destinos = s.destinos.map((d) => d.nombre).join(", ");
  const head = [
    rule("═"),
    "TURISTA BY BONESTAR · SOLICITUD DE VIAJE A MEDIDA",
    rule("═"),
    kv("Referencia", id),
    kv("Fecha", formatDateTime(createdAt)),
    kv("Destinos", destinos),
    "",
  ].join("\n");
  const cliente = section("Cliente", [
    kv("Nombre", s.contacto.nombre),
    kv("Correo", s.contacto.email),
    kv("Teléfono", s.contacto.telefono || "No indicado"),
    kv("Contactar por", canalLabel(s.contacto.canal)),
  ]);
  const prefs = summarize(s).map((sec) => section(sec.title, sec.rows.map(([k, v]) => kv(k, v)))).join("\n");
  const cierre = section("Encargo para el gestor", [
    wrap(
      `Preparar una propuesta de viaje a ${destinos} para ${s.contacto.nombre} respetando las preferencias anteriores. Lo no indicado queda a criterio del gestor y debe justificarse en la propuesta. Primera respuesta en 48 horas laborables por ${canalLabel(s.contacto.canal)}.`,
      0,
    ),
  ]);
  return `${head}\n${cliente}\n${prefs}\n${cierre}${rule("═")}\n`;
}
