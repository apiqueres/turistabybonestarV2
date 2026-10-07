import "server-only";
import { db } from "@/lib/db";
import type { FormStep } from "@/types/form";

/** Páginas del asistente guardadas en la BD, o null si todavía no hay ninguna (se usan las estáticas). */
export async function getFormSteps(): Promise<FormStep[] | null> {
  const rows = await db().formStep.findMany({ orderBy: { sortOrder: "asc" } });
  if (rows.length === 0) return null;
  return rows.map((r) => r.data as unknown as FormStep);
}

/** Sustituye el conjunto completo de páginas (el admin siempre guarda todas). */
export async function saveFormSteps(steps: FormStep[]): Promise<void> {
  const prisma = db();
  await prisma.$transaction([
    prisma.formStep.deleteMany({ where: { id: { notIn: steps.map((s) => s.id) } } }),
    ...steps.map((s, i) =>
      prisma.formStep.upsert({
        where: { id: s.id },
        create: { id: s.id, sortOrder: i, data: s as object },
        update: { sortOrder: i, data: s as object },
      }),
    ),
  ]);
}
