import { formContent } from "@/data/form";
import type { SolicitudInput } from "./validation";

/**
 * Turns a request into a readable Spanish brief ("prompt") for the agency team,
 * with question labels and option labels instead of ids. Saved next to the JSON.
 */
export function buildPrompt(id: string, createdAt: string, s: SolicitudInput): string {
  const lines: string[] = [];
  lines.push("SOLICITUD DE VIAJE A MEDIDA — TuristaByBonestar");
  lines.push(`Referencia: ${id}`);
  lines.push(`Fecha: ${new Date(createdAt).toLocaleString("es-ES", { timeZone: "Europe/Madrid" })}`);
  lines.push("");
  lines.push("CLIENTE");
  lines.push(`- Nombre: ${s.contacto.nombre}`);
  lines.push(`- Correo: ${s.contacto.email}`);
  if (s.contacto.telefono) lines.push(`- Teléfono: ${s.contacto.telefono}`);
  if (s.contacto.canal) lines.push(`- Prefiere que le contactemos por: ${labelFor("contacto", "canal", s.contacto.canal)}`);
  lines.push("");
  lines.push("DESTINOS ELEGIDOS");
  s.destinos.forEach((d) => lines.push(`- ${d.nombre}`));
  lines.push("");

  for (const step of formContent.steps.slice(1, -1)) {
    const block: string[] = [];
    for (const q of step.questions) {
      const v = s.respuestas[q.id];
      if (v === undefined || v === "" || (Array.isArray(v) && v.length === 0)) continue;
      const label = ("label" in q && q.label) || step.kicker.replace(/^\d+\s—\s/, "");
      block.push(`- ${label}: ${formatValue(step.id, q.id, v)}`);
    }
    if (block.length) {
      lines.push(step.kicker.replace(/^\d+\s—\s/, "").toUpperCase());
      lines.push(...block);
      lines.push("");
    }
  }

  lines.push("RESUMEN PARA EL GESTOR");
  lines.push(
    `Preparar una propuesta de viaje a ${s.destinos.map((d) => d.nombre).join(", ")} para ${s.contacto.nombre}, ` +
      "respetando las preferencias anteriores. Lo no indicado queda a criterio del gestor y debe justificarse en la propuesta.",
  );
  return lines.join("\n");
}

function labelFor(stepId: string, questionId: string, optionId: string): string {
  const step = formContent.steps.find((st) => st.id === stepId);
  const q = step?.questions.find((qq) => qq.id === questionId);
  if (q && (q.kind === "multi" || q.kind === "single")) return q.options.find((o) => o.id === optionId)?.label ?? optionId;
  return optionId;
}

function formatValue(stepId: string, questionId: string, v: unknown): string {
  if (Array.isArray(v)) return v.map((id) => labelFor(stepId, questionId, String(id))).join(", ");
  if (typeof v === "boolean") return v ? "Sí" : "No";
  if (typeof v === "string") return labelFor(stepId, questionId, v);
  return String(v);
}
