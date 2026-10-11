import { QuestionsDb, QuestionsDemo } from "@/components/admin/sources";
import { STATIC_DEMO } from "@/lib/config";
import { requireRole } from "@/lib/admin/session";
import { getFormSteps } from "@/lib/repo/form";
import { formContent } from "@/data/form";

export default async function QuestionsPage() {
  if (STATIC_DEMO) return <QuestionsDemo />;
  await requireRole("admin");
  return <QuestionsDb initial={(await getFormSteps()) ?? formContent.steps} />;
}
